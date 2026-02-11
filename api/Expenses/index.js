const { getExpensesContainer } = require('../shared/cosmosClient');
const { requireAuth } = require('../shared/auth');

module.exports = async function (context, req) {
  const user = requireAuth(context, req);
  if (!user) return;

  const container = getExpensesContainer();

  try {
    if (req.method === 'GET') {
      // Get all expenses for the authenticated user
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
        parameters: [
          {
            name: '@userId',
            value: user.userId
          }
        ]
      };

      const { resources: expenses } = await container.items
        .query(querySpec)
        .fetchAll();

      context.res = {
        status: 200,
        body: expenses
      };
    } else if (req.method === 'POST') {
      // Create a new expense
      const newExpense = {
        ...req.body,
        userId: user.userId,
        createdAt: new Date().toISOString()
      };

      const { resource: createdExpense } = await container.items.create(newExpense);

      context.res = {
        status: 201,
        body: createdExpense
      };
    }
  } catch (error) {
    context.log.error('Error in Expenses function:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};
