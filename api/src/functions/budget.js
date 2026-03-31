const { app } = require('@azure/functions')
const { getCallerIdentity, assertBudgetAccess } = require('../auth')
const { getBudgetDataContainer } = require('../cosmos')

function stripMeta({ _rid, _self, _etag, _attachments, _ts, ...rest }) { return rest }

// GET /api/budgets/{budgetId}/months/{year}/{month}
app.http('getBudgetMonth', {
  methods: ['GET'],
  route: 'budgets/{budgetId}/months/{year}/{month}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId }   = getCallerIdentity(request)
      const { budgetId } = request.params
      const year  = parseInt(request.params.year,  10)
      const month = parseInt(request.params.month, 10)
      await assertBudgetAccess(userId, budgetId, 'viewer')

      const id = `${budgetId}-${year}-${String(month).padStart(2, '0')}`
      const container = await getBudgetDataContainer()
      try {
        const { resource } = await container.item(id, budgetId).read()
        return { jsonBody: resource }
      } catch (e) {
        if (e.code === 404) return { status: 404, jsonBody: { error: 'Not found' } }
        throw e
      }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('getBudgetMonth error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch budget month' } }
    }
  },
})

// PUT /api/budgets/{budgetId}/months/{year}/{month}
app.http('putBudgetMonth', {
  methods: ['PUT'],
  route: 'budgets/{budgetId}/months/{year}/{month}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId }   = getCallerIdentity(request)
      const { budgetId } = request.params
      const year  = parseInt(request.params.year,  10)
      const month = parseInt(request.params.month, 10)
      await assertBudgetAccess(userId, budgetId, 'editor')

      const body = await request.json()
      const { _rid, _self, _etag, _attachments, _ts, ...rest } = body
      const id  = `${budgetId}-${year}-${String(month).padStart(2, '0')}`
      const doc = { ...rest, id, budgetId, year, month }

      const container = await getBudgetDataContainer()
      const { resource } = await container.items.upsert(doc)
      return { jsonBody: stripMeta(resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('putBudgetMonth error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save budget month' } }
    }
  },
})
