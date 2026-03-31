const { app } = require('@azure/functions')
const { getBudgetContainer } = require('../cosmos')

/**
 * Build the document id and extract the userId from SWA auth headers.
 * In local dev (no auth), userId defaults to 'anonymous'.
 */
function getContext(request, year, month) {
  const userId = request.headers.get('x-ms-client-principal-id') || 'anonymous'
  const id     = `budget-${userId}-${year}-${String(month).padStart(2, '0')}`
  return { userId, id }
}

// GET /api/budget/{year}/{month}
app.http('getBudget', {
  methods: ['GET'],
  route: 'budget/{year}/{month}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const year  = parseInt(request.params.year,  10)
      const month = parseInt(request.params.month, 10)
      const { userId, id } = getContext(request, year, month)

      const { container } = await getBudgetContainer()
      try {
        const { resource } = await container.item(id, userId).read()
        return { jsonBody: resource }
      } catch (e) {
        if (e.code === 404) {
          return { status: 404, jsonBody: { error: 'Not found' } }
        }
        throw e
      }
    } catch (err) {
      context.error('getBudget error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to fetch budget' } }
    }
  },
})

// PUT /api/budget/{year}/{month}  — full upsert (replace entire document)
app.http('putBudget', {
  methods: ['PUT'],
  route: 'budget/{year}/{month}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const year  = parseInt(request.params.year,  10)
      const month = parseInt(request.params.month, 10)
      const { userId, id } = getContext(request, year, month)

      const body = await request.json()

      // Strip Cosmos system fields that may have been round-tripped from a previous read
      const { _rid, _self, _etag, _attachments, _ts, ...rest } = body

      const doc = { ...rest, id, userId, year, month }

      const { container } = await getBudgetContainer()
      const { resource }  = await container.items.upsert(doc)
      return { jsonBody: resource }
    } catch (err) {
      context.error('putBudget error:', err.message)
      return { status: 500, jsonBody: { error: 'Failed to save budget' } }
    }
  },
})
