const BASE = '/api'

/**
 * Fetch a budget's settings document (contains masterExpenses).
 * Returns null if not yet created.
 * @param {string} budgetId
 * @returns {Promise<object|null>}
 */
export async function fetchSettings(budgetId) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/settings`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to load settings: ${res.status}`)
  return res.json()
}

/**
 * Upsert a budget's settings document.
 * @param {string} budgetId
 * @param {object} data  - e.g. { masterExpenses: [...] }
 * @returns {Promise<object>}
 */
export async function saveSettings(budgetId, data) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`)
  return res.json()
}
