import { SESSION_ENABLE_PATH } from './constants.js'
import { normalizeSessionId } from './session-enable.js'

export { SESSION_ENABLE_PATH }

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(`${JSON.stringify(payload)}\n`)
}

function requestUrl(req) {
  try {
    return new URL(req.url ?? SESSION_ENABLE_PATH, 'http://127.0.0.1')
  } catch {
    return undefined
  }
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)) return req.body
    if (typeof req.body === 'string' && req.body.trim() !== '') return JSON.parse(req.body)
  }
  const chunks = []
  if (typeof req.on === 'function') {
    const text = await new Promise((resolve, reject) => {
      req.on('data', chunk => { chunks.push(chunk) })
      req.on('end', () => {
        resolve(Buffer.concat(chunks.map(chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8'))
      })
      req.on('error', reject)
    })
    if (text.trim() === '') return {}
    return JSON.parse(text)
  }
  if (req[Symbol.asyncIterator] !== undefined) {
    for await (const chunk of req) chunks.push(chunk)
    const text = Buffer.concat(chunks.map(chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8')
    if (text.trim() === '') return {}
    return JSON.parse(text)
  }
  return {}
}

function snapshotFor(store, sessionId, getSession) {
  const id = normalizeSessionId(sessionId)
  if (id === undefined) {
    return { ok: false, error: 'session-id-required' }
  }
  return {
    ok: true,
    sessionId: id,
    enabled: store.isEnabledById(id, getSession),
    defaultEnabled: store.defaultEnabled,
    override: store.has(id),
  }
}

export async function handleSessionEnableRequest(req, res, store, getSession) {
  const method = (req.method ?? 'GET').toUpperCase()
  if (method === 'OPTIONS') {
    res.writeHead(204, { allow: 'GET, HEAD, PUT, OPTIONS' })
    res.end()
    return
  }
  if (method === 'GET' || method === 'HEAD') {
    const url = requestUrl(req)
    if (url === undefined) {
      sendJson(res, 400, { ok: false, error: 'bad-url' })
      return
    }
    const snapshot = snapshotFor(store, url.searchParams.get('sessionId'), getSession)
    sendJson(res, snapshot.ok ? 200 : 400, snapshot)
    return
  }
  if (method !== 'PUT') {
    sendJson(res, 405, { ok: false, error: 'method-not-allowed' })
    return
  }
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(res, 400, { ok: false, error: 'invalid-json' })
    return
  }
  const sessionId = normalizeSessionId(body?.sessionId)
  if (sessionId === undefined) {
    sendJson(res, 400, { ok: false, error: 'session-id-required' })
    return
  }
  if (typeof body.enabled !== 'boolean') {
    sendJson(res, 400, { ok: false, error: 'enabled-required' })
    return
  }
  try {
    store.set(sessionId, body.enabled)
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: 'invalid-request',
      message: error instanceof Error ? error.message : String(error),
    })
    return
  }
  sendJson(res, 200, snapshotFor(store, sessionId, getSession))
}

export function installSessionEnableRoutes(server, store, getSession) {
  return server.register({
    kind: 'exact',
    path: SESSION_ENABLE_PATH,
    handler: (req, res) => handleSessionEnableRequest(req, res, store, getSession),
  })
}
