const { CosmosClient } = require('@azure/cosmos')

let _client             = null
let _budgetContainer    = null   // legacy "budget-months" (migration source only)
let _userIndexContainer = null   // new "user-index"
let _budgetDataContainer = null  // new "budget-data"

function getEnv() {
  const endpoint   = process.env.COSMOS_ENDPOINT
  const key        = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_DATABASE || 'budget-tracker'
  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required')
  }
  if (!_client) _client = new CosmosClient({ endpoint, key })
  return { databaseId }
}

async function getDatabase() {
  const { databaseId } = getEnv()
  const { database } = await _client.databases.createIfNotExists({ id: databaseId })
  return database
}

// ── Legacy container (kept for migration source only) ─────────────────────────

async function getBudgetContainer() {
  if (_budgetContainer) return { client: _client, container: _budgetContainer }
  getEnv()
  const database = await getDatabase()
  const { container } = await database.containers.createIfNotExists({
    id: process.env.COSMOS_BUDGET_CONTAINER || 'budget-months',
    partitionKey: { paths: ['/userId'] },
  })
  _budgetContainer = container
  return { client: _client, container: _budgetContainer }
}

// ── New multi-user containers ─────────────────────────────────────────────────

/**
 * user-index — one doc per user listing which budgets they belong to.
 * Partition key: /userId
 */
async function getUserIndexContainer() {
  if (_userIndexContainer) return _userIndexContainer
  getEnv()
  const database = await getDatabase()
  const { container } = await database.containers.createIfNotExists({
    id: 'user-index',
    partitionKey: { paths: ['/userId'] },
  })
  _userIndexContainer = container
  return _userIndexContainer
}

/**
 * budget-data — all budget documents (metadata, monthly data, settings, invites).
 * Partition key: /budgetId  — keeps all docs for one budget co-located.
 */
async function getBudgetDataContainer() {
  if (_budgetDataContainer) return _budgetDataContainer
  getEnv()
  const database = await getDatabase()
  const { container } = await database.containers.createIfNotExists({
    id: 'budget-data',
    partitionKey: { paths: ['/budgetId'] },
  })
  _budgetDataContainer = container
  return _budgetDataContainer
}

module.exports = {
  getBudgetContainer,
  getUserIndexContainer,
  getBudgetDataContainer,
}
