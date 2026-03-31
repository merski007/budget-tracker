const BASE = '/api'

/** List all budgets the current user can access. */
export async function fetchBudgets() {
  const res = await fetch(`${BASE}/budgets`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Failed to list budgets: ${res.status}`)
  }
  return res.json()   // [{ budgetId, name, role }]
}

/** Create a new budget. Returns { budgetId, name, role }. */
export async function createBudget(name) {
  const res = await fetch(`${BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Failed to create budget: ${res.status}`)
  }
  return res.json()
}

/** Rename a budget (owner only). */
export async function renameBudget(budgetId, name) {
  const res = await fetch(`${BASE}/budgets/${budgetId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to rename budget: ${res.status}`)
  return res.json()
}

/** Delete a budget and all its data (owner only). */
export async function deleteBudget(budgetId) {
  const res = await fetch(`${BASE}/budgets/${budgetId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete budget: ${res.status}`)
}

/** Get members + pending invites for a budget. */
export async function fetchBudgetMembers(budgetId) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/members`)
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`)
  return res.json()   // { members: [...], pendingInvites: [...] }
}

/** Remove a member from a budget (owner only). */
export async function removeMember(budgetId, memberId) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/members/${memberId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Failed to remove member: ${res.status}`)
}
