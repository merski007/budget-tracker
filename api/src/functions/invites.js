const { app } = require('@azure/functions')
const { randomUUID } = require('crypto')
const { getCallerIdentity, assertBudgetAccess, addBudgetToUserIndex } = require('../auth')
const { getBudgetDataContainer } = require('../cosmos')

const INVITE_TTL_DAYS = 7

// ── POST /api/budgets/{budgetId}/invites — generate an invite code ─────────────
app.http('createInvite', {
  methods: ['POST'],
  route: 'budgets/{budgetId}/invites',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, email } = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'editor')

      const body = await request.json()
      const inviteeEmail = (body?.email || '').trim().toLowerCase()
      const role         = body?.role === 'editor' ? 'editor' : 'viewer'
      if (!inviteeEmail) return { status: 400, jsonBody: { error: 'email is required' } }

      const container = await getBudgetDataContainer()
      const { resource: meta } = await container.item(`meta-${budgetId}`, budgetId).read()

      // Check not already a member
      if (meta.members.some(m => m.email?.toLowerCase() === inviteeEmail)) {
        return { status: 409, jsonBody: { error: 'User is already a member' } }
      }

      const code      = randomUUID().replace(/-/g, '')
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400 * 1000).toISOString()

      const invite = {
        id: `invite-${code}`,
        budgetId,
        code,
        budgetName:    meta.name,
        invitedEmail:  inviteeEmail,
        invitedByEmail: email,
        role,
        status:    'pending',
        createdAt: new Date().toISOString(),
        expiresAt,
      }
      await container.items.create(invite)

      return { status: 201, jsonBody: { code, expiresAt } }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('createInvite error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to create invite' } }
    }
  },
})

// ── GET /api/invites/{code} — public info for the accept screen ────────────────
app.http('getInvite', {
  methods: ['GET'],
  route: 'invites/{code}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { code } = request.params
      const container = await getBudgetDataContainer()

      // Cross-partition query — invite docs are stored in the budget's partition
      const { resources } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.code = @code AND STARTSWITH(c.id, 'invite-')",
          parameters: [{ name: '@code', value: code }],
        })
        .fetchAll()

      const invite = resources[0]
      if (!invite) return { status: 404, jsonBody: { error: 'Invite not found' } }

      if (invite.status !== 'pending' || new Date(invite.expiresAt) < new Date()) {
        return { status: 410, jsonBody: { error: 'Invite has expired or already been used' } }
      }

      // Return only safe, non-sensitive fields
      return {
        jsonBody: {
          budgetName:    invite.budgetName,
          invitedByEmail: invite.invitedByEmail,
          role:          invite.role,
          expiresAt:     invite.expiresAt,
        },
      }
    } catch (err) {
      context.error('getInvite error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch invite' } }
    }
  },
})

// ── POST /api/invites/{code}/accept — accept an invite ────────────────────────
app.http('acceptInvite', {
  methods: ['POST'],
  route: 'invites/{code}/accept',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, email } = getCallerIdentity(request)
      const { code } = request.params
      const container = await getBudgetDataContainer()

      const { resources } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.code = @code AND STARTSWITH(c.id, 'invite-')",
          parameters: [{ name: '@code', value: code }],
        })
        .fetchAll()

      const invite = resources[0]
      if (!invite) return { status: 404, jsonBody: { error: 'Invite not found' } }
      if (invite.status !== 'pending' || new Date(invite.expiresAt) < new Date()) {
        return { status: 410, jsonBody: { error: 'Invite has expired or already been used' } }
      }

      // Optional: email match check (if invite was for a specific email)
      if (invite.invitedEmail && invite.invitedEmail !== email.toLowerCase()) {
        return { status: 403, jsonBody: { error: 'This invite was sent to a different email address' } }
      }

      const { budgetId, budgetName, role } = invite

      // Add caller as a member in the budget metadata
      const { resource: meta } = await container.item(`meta-${budgetId}`, budgetId).read()
      if (!meta.members.some(m => m.userId === userId)) {
        meta.members.push({ userId, email, role })
        await container.items.upsert(meta)
      }

      // Mark invite accepted
      invite.status     = 'accepted'
      invite.acceptedBy = email
      invite.acceptedAt = new Date().toISOString()
      await container.items.upsert(invite)

      // Add to user's index
      await addBudgetToUserIndex(userId, email, budgetId, budgetName, role)

      return { jsonBody: { budgetId, budgetName, role } }
    } catch (err) {
      context.error('acceptInvite error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to accept invite' } }
    }
  },
})

// ── DELETE /api/budgets/{budgetId}/invites/{code} — revoke pending invite ──────
app.http('revokeInvite', {
  methods: ['DELETE'],
  route: 'budgets/{budgetId}/invites/{code}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId } = getCallerIdentity(request)
      const { budgetId, code } = request.params
      await assertBudgetAccess(userId, budgetId, 'owner')

      const container = await getBudgetDataContainer()
      const inviteId  = `invite-${code}`
      await container.item(inviteId, budgetId).delete()
      return { status: 204 }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('revokeInvite error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to revoke invite' } }
    }
  },
})
