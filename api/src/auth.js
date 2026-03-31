const { getUserIndexContainer, getBudgetDataContainer } = require('./cosmos')

/**
 * Extract the caller's identity from SWA-injected headers.
 * Falls back to 'anonymous' / 'anonymous@local' in local dev (no auth proxy).
 */
function getCallerIdentity(request) {
  const userId = request.headers.get('x-ms-client-principal-id') || 'anonymous'
  const email  = request.headers.get('x-ms-client-principal-name') || 'anonymous@local'
  return { userId, email }
}

/**
 * Load (or auto-create) the caller's user-index document.
 * Returns { userId, email, budgets[] }
 */
async function getUserIndex(userId, email) {
  const container = await getUserIndexContainer()
  const id = `user-${userId}`
  try {
    const { resource } = await container.item(id, userId).read()
    // Ensure email is current (may have changed)
    if (resource.email !== email) {
      resource.email = email
      await container.items.upsert(resource)
    }
    return resource
  } catch (e) {
    if (e.code !== 404) throw e
    // First login — create a blank user-index doc
    const doc = { id, userId, email, budgets: [] }
    const { resource } = await container.items.create(doc)
    return resource
  }
}

/**
 * Verify the caller has *at least* the required role on the given budget.
 * Roles (ascending): viewer < editor < owner
 * Returns the caller's role string, or throws a 403-tagged error.
 */
const ROLE_RANK = { viewer: 1, editor: 2, owner: 3 }

async function assertBudgetAccess(userId, budgetId, requiredRole = 'viewer') {
  const container = await getBudgetDataContainer()
  const metaId = `meta-${budgetId}`
  let meta
  try {
    const { resource } = await container.item(metaId, budgetId).read()
    meta = resource
  } catch (e) {
    if (e.code === 404) {
      const err = new Error('Budget not found')
      err.statusCode = 404
      throw err
    }
    throw e
  }

  const member = meta.members.find(m => m.userId === userId)
  if (!member || (ROLE_RANK[member.role] ?? 0) < (ROLE_RANK[requiredRole] ?? 0)) {
    const err = new Error('Access denied')
    err.statusCode = 403
    throw err
  }
  return member.role
}

/**
 * Add or update the caller's reference to a budget in their user-index doc.
 */
async function addBudgetToUserIndex(userId, email, budgetId, budgetName, role) {
  const container = await getUserIndexContainer()
  const id = `user-${userId}`
  let doc
  try {
    const { resource } = await container.item(id, userId).read()
    doc = resource
  } catch (e) {
    if (e.code !== 404) throw e
    doc = { id, userId, email, budgets: [] }
  }
  const existing = doc.budgets.findIndex(b => b.budgetId === budgetId)
  if (existing >= 0) {
    doc.budgets[existing] = { budgetId, name: budgetName, role }
  } else {
    doc.budgets.push({ budgetId, name: budgetName, role })
  }
  await container.items.upsert(doc)
}

/**
 * Remove a budget reference from a user's index doc.
 */
async function removeBudgetFromUserIndex(userId, budgetId) {
  const container = await getUserIndexContainer()
  const id = `user-${userId}`
  try {
    const { resource } = await container.item(id, userId).read()
    resource.budgets = resource.budgets.filter(b => b.budgetId !== budgetId)
    await container.items.upsert(resource)
  } catch (e) {
    if (e.code !== 404) return   // already gone
    throw e
  }
}

module.exports = {
  getCallerIdentity,
  getUserIndex,
  assertBudgetAccess,
  addBudgetToUserIndex,
  removeBudgetFromUserIndex,
}
