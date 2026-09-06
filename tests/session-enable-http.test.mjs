import assert from 'node:assert/strict'
import test from 'node:test'

import { createSessionEnableStore } from '../src/session-enable.js'
import { handleSessionEnableRequest, SESSION_ENABLE_PATH } from '../src/session-enable-http.js'

function fakeRes() {
  const result = { status: 0, headers: {}, body: '' }
  const res = {
    writeHead(status, headers) {
      result.status = status
      result.headers = headers
    },
    end(body = '') {
      result.body = body
    },
  }
  return { res, result }
}

function parse(result) {
  return JSON.parse(result.body)
}

test('GET returns the default-on snapshot', async () => {
  const store = createSessionEnableStore({ defaultEnabled: true })
  const { res, result } = fakeRes()
  await handleSessionEnableRequest(
    { method: 'GET', url: `${SESSION_ENABLE_PATH}?sessionId=sess-1` },
    res,
    store,
  )
  assert.equal(result.status, 200)
  assert.deepEqual(parse(result), {
    ok: true,
    sessionId: 'sess-1',
    enabled: true,
    defaultEnabled: true,
    override: false,
  })
})

test('PUT stores an explicit off and GET reads it back', async () => {
  const store = createSessionEnableStore({ defaultEnabled: true })
  const put = fakeRes()
  await handleSessionEnableRequest(
    { method: 'PUT', url: SESSION_ENABLE_PATH, body: { sessionId: 'sess-1', enabled: false } },
    put.res,
    store,
  )
  assert.equal(put.result.status, 200)
  assert.equal(parse(put.result).enabled, false)
  assert.equal(parse(put.result).override, true)

  const get = fakeRes()
  await handleSessionEnableRequest(
    { method: 'GET', url: `${SESSION_ENABLE_PATH}?sessionId=sess-1` },
    get.res,
    store,
  )
  assert.equal(parse(get.result).enabled, false)
})

test('PUT without a session id is rejected', async () => {
  const store = createSessionEnableStore()
  const { res, result } = fakeRes()
  await handleSessionEnableRequest(
    { method: 'PUT', url: SESSION_ENABLE_PATH, body: { enabled: false } },
    res,
    store,
  )
  assert.equal(result.status, 400)
  assert.equal(parse(result).error, 'session-id-required')
})

test('unsupported methods are rejected', async () => {
  const store = createSessionEnableStore()
  const { res, result } = fakeRes()
  await handleSessionEnableRequest({ method: 'POST', url: SESSION_ENABLE_PATH }, res, store)
  assert.equal(result.status, 405)
})
