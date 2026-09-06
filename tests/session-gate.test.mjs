import assert from 'node:assert/strict'
import test from 'node:test'

import { SESSION_ENABLE_PATH } from '../src/constants.js'
import { createSessionEnableStore } from '../src/session-enable.js'
import { handleSessionEnableRequest } from '../src/session-enable-http.js'
import { attachSessionEnable } from '../src/session-gate.js'

function createCtx() {
  const handlers = new Map()
  const agents = []
  const sessions = new Map()
  const ctx = {
    logger: { warn() {} },
    sessions: {
      get(id) {
        return sessions.get(id)
      },
    },
    agents: {
      list() {
        return agents
      },
    },
    tools: {
      schemas() {
        return [{ name: 'mcp__nowledge_mem__memory_search' }, { name: 'bash' }]
      },
    },
    on(event, handler) {
      const list = handlers.get(event) ?? []
      list.push(handler)
      handlers.set(event, list)
      return () => {}
    },
  }
  return { ctx, handlers, sessions, agents }
}

async function putEnabled(store, sessionId, enabled) {
  const res = {
    status: 0,
    body: '',
    writeHead(status) { this.status = status },
    end(body = '') { this.body = body },
  }
  await handleSessionEnableRequest(
    { method: 'PUT', url: SESSION_ENABLE_PATH, body: { sessionId, enabled } },
    res,
    store,
  )
  return res
}

test('a disabled session denies Mem MCP tools and reports as inactive', async () => {
  const { ctx, handlers, sessions } = createCtx()
  const store = createSessionEnableStore({ defaultEnabled: true })
  const { sessionIsEnabled } = attachSessionEnable(ctx, store)
  const session = { header: { id: 'sess-off' } }
  sessions.set('sess-off', session)

  assert.equal(sessionIsEnabled(session), true)
  const put = await putEnabled(store, 'sess-off', false)
  assert.equal(put.status, 200)
  assert.equal(sessionIsEnabled(session), false)

  const denied = await handlers.get('tools/pre-execute')[0](
    { name: 'mcp__nowledge_mem__memory_search', agent: { session } },
    () => ({ kind: 'allow' }),
  )
  assert.deepEqual(denied, {
    kind: 'deny',
    reason: 'Nowledge Mem is disabled for this session',
  })

  const allowed = await handlers.get('tools/pre-execute')[0](
    { name: 'bash', agent: { session } },
    () => ({ kind: 'allow' }),
  )
  assert.deepEqual(allowed, { kind: 'allow' })
})

test('hiding Mem tools uses a scoped deny list and lifts it when re-enabled', async () => {
  const { ctx, handlers, sessions, agents } = createCtx()
  const store = createSessionEnableStore({ defaultEnabled: true })
  const restricted = []
  const agent = {
    session: { header: { id: 'sess-1' } },
    ctx: {
      tools: {
        restrict(filter) {
          restricted.push(filter)
          return () => { restricted.push('lifted') }
        },
      },
    },
  }
  sessions.set('sess-1', agent.session)
  agents.push(agent)
  attachSessionEnable(ctx, store)

  handlers.get('agent/created')[0]({ agent })
  assert.deepEqual(restricted, [])

  await putEnabled(store, 'sess-1', false)
  assert.deepEqual(restricted, [{ deny: ['mcp__nowledge_mem__memory_search'] }])

  await putEnabled(store, 'sess-1', true)
  assert.deepEqual(restricted, [{ deny: ['mcp__nowledge_mem__memory_search'] }, 'lifted'])
})
