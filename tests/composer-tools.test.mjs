import assert from 'node:assert/strict'
import test from 'node:test'

import { composerToolsLayout } from '../src/composer-tools.js'
import { registerComposerTools } from '../src/client/register.js'
import {
  COMPOSER_TOOLS_HOST_ID,
  COMPOSER_TOOLS_HOST_SLOT,
  COMPOSER_TOOLS_MEM_ID,
  COMPOSER_TOOLS_MENU_SLOT,
} from '../src/constants.js'
import { isMemToolName, shouldDenyMemTool } from '../src/mcp-tools.js'
import { fetchSessionEnable, sessionEnableUrl } from '../src/client/api.js'

test('one tool item stays a chip; two or more become a dropdown', () => {
  assert.equal(composerToolsLayout(0), 'hidden')
  assert.equal(composerToolsLayout(1), 'chip')
  assert.equal(composerToolsLayout(2), 'menu')
  assert.equal(composerToolsLayout(-1), 'hidden')
})

test('Mem MCP tools are recognized by the nowledge_mem prefix', () => {
  assert.equal(isMemToolName('mcp__nowledge_mem__memory_search'), true)
  assert.equal(isMemToolName('bash'), false)
  assert.equal(shouldDenyMemTool('mcp__nowledge_mem__memory_search', false), true)
  assert.equal(shouldDenyMemTool('mcp__nowledge_mem__memory_search', true), false)
})

test('the session-enable URL encodes the session id', () => {
  assert.equal(
    sessionEnableUrl('sess 1'),
    '/__nowledge-mem/session-enable?sessionId=sess+1',
  )
})

test('fetchSessionEnable maps an empty 404 to HTTP 404', async () => {
  await assert.rejects(
    () => fetchSessionEnable('sess-1', async () => new Response('', { status: 404 })),
    /HTTP 404/,
  )
})

test('client registration mounts a tools host and a Nowledge Mem item', () => {
  const registrations = []
  const ctx = {
    slots: {
      inject(name, callback) {
        callback()
        return () => {}
      },
      register(options, component) {
        registrations.push({ options, component })
        return () => {}
      },
    },
    on() {
      return () => {}
    },
  }
  const Host = function Host() {}
  const Item = function Item() {}
  registerComposerTools(ctx, { Host, Item })
  assert.equal(registrations.length, 2)
  assert.equal(registrations[0].options.name, COMPOSER_TOOLS_HOST_SLOT)
  assert.equal(registrations[0].options.id, COMPOSER_TOOLS_HOST_ID)
  assert.deepEqual(registrations[0].options.children[COMPOSER_TOOLS_MENU_SLOT], {
    kind: 'list',
    scope: 'session',
  })
  assert.equal(registrations[0].component, Host)
  assert.equal(registrations[1].options.name, COMPOSER_TOOLS_MENU_SLOT)
  assert.equal(registrations[1].options.id, COMPOSER_TOOLS_MEM_ID)
  assert.equal(registrations[1].component, Item)
  assert.deepEqual(registrations[0].options.inject('sess-1').sessionId, 'sess-1')
})
