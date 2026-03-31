const BASE = '/api'

/**
 * Fetch the user's global settings document (contains masterExpenses).
 * Returns null if not yet created.
 * @returns {Promise<object|null>}
 */
export async function fetchSettings() {
  const res = await fetch(`${BASE}/settings`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to load settings: ${res.status}`)
  return res.json()
}

/**
 * Upsert the user's global settings document.
 * @param {object} data  - e.g. { masterExpenses: [...] }
 * @returns {Promise<object>}
 */
export async function saveSettings(data) {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`)
  return res.json()
}
