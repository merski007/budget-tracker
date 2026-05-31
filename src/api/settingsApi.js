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
 * Upsert a budget's settings document with optimistic concurrency.
 * Pass the `_etag` from the last fetched/saved settings doc; on a version conflict
 * the server returns the current document instead of overwriting it.
 *
 * @returns {Promise<{conflict: false, doc: object} | {conflict: true, current: object|null}>}
 */
export async function saveSettings(budgetId, data, etag) {
  const body = etag ? { ...data, _etag: etag } : data
  const res = await fetch(`${BASE}/budgets/${budgetId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const j = await res.json().catch(() => ({}))
    return { conflict: true, current: j.current ?? null }
  }
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`)
  return { conflict: false, doc: await res.json() }
}
