const { CosmosClient } = require('@azure/cosmos')

let _client        = null
let _container     = null
let _budgetContainer = null

/**
 * Returns a cached Cosmos DB client and the `entries` container.
 *
 * Required environment variables (set in Azure Static Web Apps app settings):
 *   COSMOS_ENDPOINT  — e.g. https://your-account.documents.azure.com:443/
 *   COSMOS_KEY       — primary or secondary key
 *   COSMOS_DATABASE  — database name  (default: budget-tracker)
 *   COSMOS_CONTAINER — container name (default: entries)
 */
async function getCosmosClient() {
  if (_container) return { client: _client, container: _container }

  const endpoint    = process.env.COSMOS_ENDPOINT
  const key         = process.env.COSMOS_KEY
  const databaseId  = process.env.COSMOS_DATABASE  || 'budget-tracker'
  const containerId = process.env.COSMOS_CONTAINER || 'entries'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required')
  }

  _client = new CosmosClient({ endpoint, key })
  const { database } = await _client.databases.createIfNotExists({ id: databaseId })
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/id'] },
  })

  _container = container
  return { client: _client, container: _container }
}

/**
 * Returns a cached Cosmos DB client and the `budget-months` container.
 * Partition key is `/userId` so each user's months live in the same partition.
 *
 *   COSMOS_BUDGET_CONTAINER — container name (default: budget-months)
 */
async function getBudgetContainer() {
  if (_budgetContainer) return { client: _client, container: _budgetContainer }

  const endpoint    = process.env.COSMOS_ENDPOINT
  const key         = process.env.COSMOS_KEY
  const databaseId  = process.env.COSMOS_DATABASE        || 'budget-tracker'
  const containerId = process.env.COSMOS_BUDGET_CONTAINER || 'budget-months'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required')
  }

  if (!_client) {
    _client = new CosmosClient({ endpoint, key })
  }
  const { database } = await _client.databases.createIfNotExists({ id: databaseId })
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/userId'] },
  })

  _budgetContainer = container
  return { client: _client, container: _budgetContainer }
}

module.exports = { getCosmosClient, getBudgetContainer }
