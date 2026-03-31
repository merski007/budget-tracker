const BASE = '/api'

/**
 * Fetch a month's budget document.
 * Returns null on 404, throws on other errors.
 * @param {string} budgetId
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Promise<object|null>}
 */
export async function fetchBudgetMonth(budgetId, year, month) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/months/${year}/${month}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to load budget: ${res.status}`)
  return res.json()
}

/**
 * Upsert a month's budget document.
 * @param {string} budgetId
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function saveBudgetMonth(budgetId, year, month, data) {
  const res = await fetch(`${BASE}/budgets/${budgetId}/months/${year}/${month}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save budget: ${res.status}`)
  return res.json()
}
