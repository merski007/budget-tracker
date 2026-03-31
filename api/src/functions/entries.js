const { app } = require('@azure/functions')
const { getCosmosClient } = require('../cosmos')

// GET /api/entries
app.http('getEntries', {
  methods: ['GET'],
  route: 'entries',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { container } = await getCosmosClient()
      const { resources } = await container.items
        .query('SELECT * FROM c ORDER BY c.createdAt DESC')
        .fetchAll()
      return { jsonBody: resources }
    } catch (err) {
      context.error('getEntries error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch entries' } }
    }
  },
})

// POST /api/entries
app.http('createEntry', {
  methods: ['POST'],
  route: 'entries',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json()
      const { container } = await getCosmosClient()
      const { resource } = await container.items.create(body)
      return { status: 201, jsonBody: resource }
    } catch (err) {
      context.error('createEntry error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to create entry' } }
    }
  },
})

// DELETE /api/entries/{id}
app.http('deleteEntry', {
  methods: ['DELETE'],
  route: 'entries/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const id = request.params.id
      const { container } = await getCosmosClient()
      await container.item(id, id).delete()
      return { status: 204 }
    } catch (err) {
      context.error('deleteEntry error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to delete entry' } }
    }
  },
})
