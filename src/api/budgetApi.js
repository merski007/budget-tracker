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
 * Upsert a month's budget document with optimistic concurrency.
 * Pass the `_etag` from the last fetched/saved doc; on a version conflict the
 * server returns the current document instead of overwriting it.
 *
 * @returns {Promise<{conflict: false, doc: object} | {conflict: true, current: object|null}>}
 */
export async function saveBudgetMonth(budgetId, year, month, data, etag) {
  const body = etag ? { ...data, _etag: etag } : data
  const res = await fetch(`${BASE}/budgets/${budgetId}/months/${year}/${month}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const j = await res.json().catch(() => ({}))
    return { conflict: true, current: j.current ?? null }
  }
  if (!res.ok) throw new Error(`Failed to save budget: ${res.status}`)
  return { conflict: false, doc: await res.json() }
}
