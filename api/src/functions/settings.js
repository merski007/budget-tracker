const { app } = require('@azure/functions')
const { getBudgetContainer } = require('../cosmos')

/**
 * Single settings document per user, stored in the budget-months container.
 * id:           settings-{userId}
 * partitionKey: userId
 */
function getContext(request) {
  const userId = request.headers.get('x-ms-client-principal-id') || 'anonymous'
  const id     = `settings-${userId}`
  return { userId, id }
}

// GET /api/settings
app.http('getSettings', {
  methods: ['GET'],
  route: 'settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, id } = getContext(request)
      const { container }  = await getBudgetContainer()
      try {
        const { resource } = await container.item(id, userId).read()
        return { jsonBody: resource }
      } catch (e) {
        if (e.code === 404) return { status: 404, jsonBody: { error: 'Not found' } }
        throw e
      }
    } catch (err) {
      context.error('getSettings error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch settings' } }
    }
  },
})

// PUT /api/settings
app.http('putSettings', {
  methods: ['PUT'],
  route: 'settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, id } = getContext(request)
      const body = await request.json()
      const { _rid, _self, _etag, _attachments, _ts, ...rest } = body
      const doc = { ...rest, id, userId }

      const { container } = await getBudgetContainer()
      const { resource }  = await container.items.upsert(doc)
      return { jsonBody: resource }
    } catch (err) {
      context.error('putSettings error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save settings' } }
    }
  },
})
