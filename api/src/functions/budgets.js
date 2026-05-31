const { app } = require('@azure/functions')
const { randomUUID } = require('crypto')
const {
  getCallerIdentity,
  getUserIndex,
  assertBudgetAccess,
  addBudgetToUserIndex,
  removeBudgetFromUserIndex,
} = require('../auth')
const { getBudgetDataContainer, getBudgetContainer } = require('../cosmos')
const { DEFAULT_FIXED_EXPENSES, DEFAULT_MASTER_INCOME, DEFAULT_MASTER_CREDIT_CARDS } = require('../defaults')

// ── Helper: strip Cosmos system fields ────────────────────────────────────────
function stripMeta({ _rid, _self, _etag, _attachments, _ts, ...rest }) { return rest }

// ── GET /api/budgets  — list all budgets the caller can access ─────────────────
app.http('getBudgets', {
  methods: ['GET'],
  route: 'budgets',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, email } = getCallerIdentity(request)
      const userIndex = await getUserIndex(userId, email)

      // Auto-migrate legacy data on first access (no budgets yet)
      if (userIndex.budgets.length === 0) {
        const migrated = await migrateLegacyData(userId, email)
        if (migrated) {
          // Reload after migration
          const fresh = await getUserIndex(userId, email)
          return { jsonBody: fresh.budgets }
        }
      }

      return { jsonBody: userIndex.budgets }
    } catch (err) {
      context.error('getBudgets error:', err.message, err.stack)
      return { status: 500, jsonBody: { error: err.message || 'Failed to list budgets' } }
    }
  },
})

// ── POST /api/budgets  — create a new budget ──────────────────────────────────
app.http('createBudget', {
  methods: ['POST'],
  route: 'budgets',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, email } = getCallerIdentity(request)
      const body = await request.json()
      const name = (body?.name || 'My Budget').trim()

      const budgetId = randomUUID()
      const container = await getBudgetDataContainer()

      // Create metadata doc
      const meta = {
        id: `meta-${budgetId}`,
        budgetId,
        name,
        ownerId: userId,
        members: [{ userId, email, role: 'owner' }],
        createdAt: new Date().toISOString(),
      }
      await container.items.create(meta)

      // Create default settings doc (all templates start blank)
      const settings = {
        id: `settings-${budgetId}`,
        budgetId,
        masterExpenses:    DEFAULT_FIXED_EXPENSES.map(e => ({ ...e })),
        masterIncome:      DEFAULT_MASTER_INCOME.map(i => ({ ...i })),
        masterCreditCards: DEFAULT_MASTER_CREDIT_CARDS.map(c => ({ ...c })),
      }
      await container.items.create(settings)

      // Register in user-index
      await addBudgetToUserIndex(userId, email, budgetId, name, 'owner')

      return { status: 201, jsonBody: { budgetId, name, role: 'owner' } }
    } catch (err) {
      context.error('createBudget error:', err.message, err.stack)
      return { status: 500, jsonBody: { error: err.message || 'Failed to create budget' } }
    }
  },
})

// ── PATCH /api/budgets/{budgetId}  — rename ────────────────────────────────────
app.http('patchBudget', {
  methods: ['PATCH'],
  route: 'budgets/{budgetId}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId } = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'owner')

      const body = await request.json()
      const name = (body?.name || '').trim()
      if (!name) return { status: 400, jsonBody: { error: 'name is required' } }

      const container = await getBudgetDataContainer()
      const metaId = `meta-${budgetId}`
      const { resource: meta } = await container.item(metaId, budgetId).read()
      meta.name = name
      const { resource } = await container.items.upsert(meta)

      // Update name in every member's user-index entry
      for (const member of resource.members) {
        await addBudgetToUserIndex(member.userId, member.email, budgetId, name, member.role)
      }

      return { jsonBody: stripMeta(resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('patchBudget error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to rename budget' } }
    }
  },
})

// ── DELETE /api/budgets/{budgetId}  — delete budget and all its data ──────────
app.http('deleteBudget', {
  methods: ['DELETE'],
  route: 'budgets/{budgetId}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId } = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'owner')

      const container = await getBudgetDataContainer()

      // Capture the member list BEFORE deleting the metadata doc, so we can clean
      // up every member's user-index (not just the requester's).
      let members = []
      try {
        const { resource: meta } = await container.item(`meta-${budgetId}`, budgetId).read()
        members = meta?.members ?? []
      } catch {
        members = []
      }

      // Fetch all documents in this budget's partition
      const { resources } = await container.items
        .query({
          query: 'SELECT c.id FROM c WHERE c.budgetId = @budgetId',
          parameters: [{ name: '@budgetId', value: budgetId }],
        })
        .fetchAll()

      for (const doc of resources) {
        await container.item(doc.id, budgetId).delete()
      }

      // Remove the budget from every member's user-index. Fall back to at least the
      // requesting user if the member list could not be read.
      const memberIds = members.length ? members.map(m => m.userId) : [userId]
      for (const memberId of memberIds) {
        await removeBudgetFromUserIndex(memberId, budgetId)
      }

      return { status: 204 }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('deleteBudget error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to delete budget' } }
    }
  },
})

// ── GET /api/budgets/{budgetId}/members ───────────────────────────────────────
app.http('getBudgetMembers', {
  methods: ['GET'],
  route: 'budgets/{budgetId}/members',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId } = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'viewer')

      const container = await getBudgetDataContainer()
      const { resource: meta } = await container.item(`meta-${budgetId}`, budgetId).read()

      // Get pending invites
      const { resources: invites } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.budgetId = @budgetId AND STARTSWITH(c.id, 'invite-') AND c.status = 'pending'",
          parameters: [{ name: '@budgetId', value: budgetId }],
        })
        .fetchAll()

      return { jsonBody: { members: meta.members, pendingInvites: invites } }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('getBudgetMembers error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to get members' } }
    }
  },
})

// ── DELETE /api/budgets/{budgetId}/members/{memberId} — remove member ──────────
app.http('removeBudgetMember', {
  methods: ['DELETE'],
  route: 'budgets/{budgetId}/members/{memberId}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId } = getCallerIdentity(request)
      const { budgetId, memberId } = request.params
      await assertBudgetAccess(userId, budgetId, 'owner')

      const container = await getBudgetDataContainer()
      const { resource: meta } = await container.item(`meta-${budgetId}`, budgetId).read()

      const target = meta.members.find(m => m.userId === memberId)
      if (!target) return { status: 404, jsonBody: { error: 'Member not found' } }
      if (target.role === 'owner') return { status: 400, jsonBody: { error: 'Cannot remove the owner' } }

      meta.members = meta.members.filter(m => m.userId !== memberId)
      await container.items.upsert(meta)
      await removeBudgetFromUserIndex(memberId, budgetId)

      return { status: 204 }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('removeBudgetMember error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to remove member' } }
    }
  },
})

// ── Migration: copy legacy budget-months data into budget-data ─────────────────
async function migrateLegacyData(userId, email) {
  try {
    const { container: legacyContainer } = await getBudgetContainer()

    // Check if any legacy docs exist for this user
    const { resources: legacyDocs } = await legacyContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll()

    if (legacyDocs.length === 0) return false

    const budgetId = randomUUID()
    const budgetName = `${email.split('@')[0]}'s Budget`
    const container = await getBudgetDataContainer()

    // Create metadata
    const meta = {
      id: `meta-${budgetId}`,
      budgetId,
      name: budgetName,
      ownerId: userId,
      members: [{ userId, email, role: 'owner' }],
      createdAt: new Date().toISOString(),
      migratedFrom: 'legacy',
    }
    await container.items.upsert(meta)

    // Migrate each legacy doc (monthly data + settings)
    for (const doc of legacyDocs) {
      const { _rid, _self, _etag, _attachments, _ts, id: oldId, userId: _uid, ...rest } = doc

      let newId
      if (oldId.startsWith('settings-')) {
        newId = `settings-${budgetId}`
      } else {
        // budget-{userId}-{year}-{month}
        const parts = oldId.split('-')
        const year  = parts[parts.length - 2]
        const month = parts[parts.length - 1]
        // Match the live GET/PUT id format, which zero-pads the month.
        newId = `${budgetId}-${year}-${String(parseInt(month, 10)).padStart(2, '0')}`
      }

      await container.items.upsert({ ...rest, id: newId, budgetId })
    }

    await addBudgetToUserIndex(userId, email, budgetId, budgetName, 'owner')
    return true
  } catch (err) {
    // Migration is best-effort — don't block the user
    console.error('Migration error:', err.message)
    return false
  }
}
