const BASE = '/api'

/**
 * Create an invite for a budget.
 * @param {string} budgetId
 * @param {string} email     - invitee's email
 * @param {'viewer'|'editor'} role
 * @returns {Promise<{ code: string, expiresAt: string }>}
 */
export async function createInvite(budgetId, email, role = 'viewer') {
  const res = await fetch(`${BASE}/budgets/${budgetId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  })
  if (res.status === 409) {
    const j = await res.json()
    throw Object.assign(new Error(j.error), { status: 409 })
  }
  if (!res.ok) throw new Error(`Failed to create invite: ${res.status}`)
  return res.json()
}

/**
 * Fetch public info for an invite code (for the accept screen).
 * Returns null on 404, throws a tagged error on 410 (expired/used).
 */
export async function fetchInvite(code) {
  const res = await fetch(`${BASE}/invites/${code}`)
  if (res.status === 404) return null
  if (res.status === 410) {
    const j = await res.json()
    throw Object.assign(new Error(j.error), { status: 410 })
  }
  if (!res.ok) throw new Error(`Failed to fetch invite: ${res.status}`)
  return res.json()
}

/**
 * Accept an invite.
 * @returns {Promise<{ budgetId, budgetName, role }>}
 */
export async function acceptInvite(code) {
  const res = await fetch(`${BASE}/invites/${code}/accept`, { method: 'POST' })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw Object.assign(new Error(j.error || 'Failed to accept invite'), { status: res.status })
  }
  return res.json()
}

/** Revoke a pending invite (owner only). */
export async function revokeInvite(budgetId, code) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/invites/${code}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to revoke invite: ${res.status}`)
}
