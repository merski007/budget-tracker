const { CosmosClient } = require('@azure/cosmos');

let cosmosClient;
let database;
let budgetsContainer;
let expensesContainer;

function initializeCosmosClient() {
  if (cosmosClient) return;

  const endpoint = process.env.COSMOS_DB_ENDPOINT;
  const key = process.env.COSMOS_DB_KEY;
  const databaseId = process.env.COSMOS_DB_DATABASE || 'BudgetTrackerDB';

  if (!endpoint || !key) {
    throw new Error('Cosmos DB endpoint and key must be configured');
  }

  cosmosClient = new CosmosClient({ endpoint, key });
  database = cosmosClient.database(databaseId);
  budgetsContainer = database.container('Budgets');
  expensesContainer = database.container('Expenses');
}

module.exports = {
  initializeCosmosClient,
  getDatabase: () => {
    if (!database) initializeCosmosClient();
    return database;
  },
  getBudgetsContainer: () => {
    if (!budgetsContainer) initializeCosmosClient();
    return budgetsContainer;
  },
  getExpensesContainer: () => {
    if (!expensesContainer) initializeCosmosClient();
    return expensesContainer;
  }
};
