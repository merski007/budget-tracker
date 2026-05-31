const { app } = require('@azure/functions')
const { getCallerIdentity, assertBudgetAccess } = require('../auth')
const { getBudgetDataContainer } = require('../cosmos')
const { stripSystemMeta, writeWithConcurrency } = require('../concurrency')

// GET /api/budgets/{budgetId}/settings
app.http('getBudgetSettings', {
  methods: ['GET'],
  route: 'budgets/{budgetId}/settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId }   = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'viewer')

      const id        = `settings-${budgetId}`
      const container = await getBudgetDataContainer()
      const { resource } = await container.item(id, budgetId).read()
      if (!resource) return { status: 404, jsonBody: null }
      return { jsonBody: stripSystemMeta(resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('getBudgetSettings error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch settings' } }
    }
  },
})

// PUT /api/budgets/{budgetId}/settings
app.http('putBudgetSettings', {
  methods: ['PUT'],
  route: 'budgets/{budgetId}/settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId }   = getCallerIdentity(request)
      const { budgetId } = request.params
      await assertBudgetAccess(userId, budgetId, 'editor')

      const body = await request.json()
      const { _rid, _self, _etag, _attachments, _ts, ...rest } = body
      const id  = `settings-${budgetId}`
      const doc = { ...rest, id, budgetId }

      const container = await getBudgetDataContainer()
      const result = await writeWithConcurrency(container, doc, id, budgetId, _etag)
      if (!result.ok) {
        return { status: 409, jsonBody: { conflict: true, current: result.current ? stripSystemMeta(result.current) : null } }
      }
      return { jsonBody: stripSystemMeta(result.resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('putBudgetSettings error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save settings' } }
    }
  },
})
