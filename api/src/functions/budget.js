const { app } = require('@azure/functions')
const { getCallerIdentity, assertBudgetAccess } = require('../auth')
const { getBudgetDataContainer } = require('../cosmos')
const { stripSystemMeta, writeWithConcurrency } = require('../concurrency')

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
      const { resource } = await container.item(id, budgetId).read()
      if (!resource) return { status: 404, jsonBody: null }
      return { jsonBody: stripSystemMeta(resource) }
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
      const result = await writeWithConcurrency(container, doc, id, budgetId, _etag)
      if (!result.ok) {
        return { status: 409, jsonBody: { conflict: true, current: result.current ? stripSystemMeta(result.current) : null } }
      }
      return { jsonBody: stripSystemMeta(result.resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('putBudgetMonth error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save budget month' } }
    }
  },
})
