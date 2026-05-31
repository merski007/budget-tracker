/**
 * Optimistic-concurrency helpers shared by the month and settings endpoints.
 *
 * Cosmos assigns every document an `_etag` that changes on each write. By keeping
 * that etag on read responses and requiring it back on writes (IfMatch), two people
 * editing the same document can no longer silently overwrite each other: a stale
 * write fails and the caller is told to reconcile.
 */

// Remove internal Cosmos fields but KEEP `_etag` so the client can echo it back.
function stripSystemMeta({ _rid, _self, _attachments, _ts, ...rest }) {
  return rest
}

// Remove `_etag` from a body before writing it (it is passed via accessCondition).
function stripEtag({ _etag, ...rest }) {
  return rest
}

/**
 * Write `doc` with optimistic concurrency.
 * - With an `etag`: conditional replace (IfMatch). A mismatch resolves to a conflict.
 * - Without an `etag` (brand-new doc): create. An existing doc resolves to a conflict.
 *
 * Returns { ok: true, resource } on success, or { ok: false, current } on conflict,
 * where `current` is the latest server document (including its `_etag`).
 */
async function writeWithConcurrency(container, doc, id, partitionKey, etag) {
  const body = stripEtag(doc)

  if (etag) {
    try {
      const { resource } = await container
        .item(id, partitionKey)
        .replace(body, { accessCondition: { type: 'IfMatch', condition: etag } })
      return { ok: true, resource }
    } catch (err) {
      if (err.code === 412 || err.statusCode === 412 || err.code === 404 || err.statusCode === 404) {
        const { resource: current } = await container.item(id, partitionKey).read()
        return { ok: false, current: current ?? null }
      }
      throw err
    }
  }

  try {
    const { resource } = await container.items.create(body)
    return { ok: true, resource }
  } catch (err) {
    if (err.code === 409 || err.statusCode === 409) {
      const { resource: current } = await container.item(id, partitionKey).read()
      return { ok: false, current: current ?? null }
    }
    throw err
  }
}

module.exports = { stripSystemMeta, stripEtag, writeWithConcurrency }
