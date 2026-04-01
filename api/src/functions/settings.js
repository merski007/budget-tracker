const { app } = require('@azure/functions')
const { getCallerIdentity, assertBudgetAccess } = require('../auth')
const { getBudgetDataContainer } = require('../cosmos')

function stripMeta({ _rid, _self, _etag, _attachments, _ts, ...rest }) { return rest }

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
      return { jsonBody: stripMeta(resource) }
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
      const { resource } = await container.items.upsert(doc)
      return { jsonBody: stripMeta(resource) }
    } catch (err) {
      if (err.statusCode) return { status: err.statusCode, jsonBody: { error: err.message } }
      context.error('putBudgetSettings error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save settings' } }
    }
  },
})
