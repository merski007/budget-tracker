const { getBudgetsContainer } = require('../shared/cosmosClient');
const { requireAuth } = require('../shared/auth');

module.exports = async function (context, req) {
  const user = requireAuth(context, req);
  if (!user) return;

  const container = getBudgetsContainer();

  try {
    if (req.method === 'GET') {
      // Get all budgets for the authenticated user
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [
          {
            name: '@userId',
            value: user.userId
          }
        ]
      };

      const { resources: budgets } = await container.items
        .query(querySpec)
        .fetchAll();

      context.res = {
        status: 200,
        body: budgets
      };
    } else if (req.method === 'POST') {
      // Create a new budget
      const newBudget = {
        ...req.body,
        userId: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource: createdBudget } = await container.items.create(newBudget);

      context.res = {
        status: 201,
        body: createdBudget
      };
    }
  } catch (error) {
    context.log.error('Error in Budgets function:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};
