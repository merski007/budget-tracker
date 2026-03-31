const BASE = '/api'

/**
 * Fetch a month's budget document.
 * Returns null on 404, throws on other errors.
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Promise<object|null>}
 */
export async function fetchBudgetMonth(year, month) {
  const res = await fetch(`${BASE}/budget/${year}/${month}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to load budget: ${res.status}`)
  return res.json()
}

/**
 * Upsert a month's budget document.
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {object} data  - full document payload (sans Cosmos system fields)
 * @returns {Promise<object>}
 */
export async function saveBudgetMonth(year, month, data) {
  const res = await fetch(`${BASE}/budget/${year}/${month}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save budget: ${res.status}`)
  return res.json()
}
