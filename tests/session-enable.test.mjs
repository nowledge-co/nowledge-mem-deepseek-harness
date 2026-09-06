import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createSessionEnableStore,
  decodeSessionEnableFile,
  encodeSessionEnableFile,
  resolveDshHome,
  resolveSessionEnabled,
  sessionEnableFilePath,
} from '../src/session-enable.js'

function session(id, parentSession) {
  return { header: { id, ...parentSession === undefined ? {} : { parentSession } } }
}

test('DSH_HOME resolution prefers a non-empty env override', () => {
  assert.equal(resolveDshHome({ DSH_HOME: '/tmp/custom-dsh' }), '/tmp/custom-dsh')
  assert.equal(sessionEnableFilePath({ DSH_HOME: '/tmp/custom-dsh' }), '/tmp/custom-dsh/nowledge-mem/session-enabled.json')
})

test('an empty DSH_HOME falls back to ~/.dsh', () => {
  const path = resolveDshHome({ DSH_HOME: '   ' })
  assert.match(path, /\.dsh$/)
})

test('decode skips malformed session ids and non-boolean values', () => {
  const sessions = decodeSessionEnableFile(JSON.stringify({
    version: 1,
    sessions: {
      'sess-1': false,
      '': true,
      'sess-2': 'no',
      'sess-3': true,
    },
  }))
  assert.equal(sessions.get('sess-1'), false)
  assert.equal(sessions.get('sess-3'), true)
  assert.equal(sessions.has(''), false)
  assert.equal(sessions.has('sess-2'), false)
})

test('encode round-trips explicit overrides', () => {
  const sessions = new Map([['a', false], ['b', true]])
  const decoded = decodeSessionEnableFile(encodeSessionEnableFile(sessions))
  assert.deepEqual([...decoded.entries()], [['a', false], ['b', true]])
})

test('sessions default on and remember an explicit off', () => {
  const store = createSessionEnableStore({ defaultEnabled: true })
  assert.equal(store.isEnabledById('sess-1'), true)
  store.set('sess-1', false)
  assert.equal(store.isEnabledById('sess-1'), false)
  assert.equal(store.isEnabledById('sess-2'), true)
})

test('child sessions inherit a parent override until they have their own', () => {
  const store = createSessionEnableStore({ defaultEnabled: true })
  const parent = session('parent')
  const child = session('child', 'parent')
  const getSession = id => id === 'parent' ? parent : id === 'child' ? child : undefined
  store.set('parent', false)
  assert.equal(resolveSessionEnabled(store, child, getSession), false)
  store.set('child', true)
  assert.equal(resolveSessionEnabled(store, child, getSession), true)
})

test('persists overrides to disk and reloads them', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nowledge-mem-enable-'))
  const filePath = join(dir, 'session-enabled.json')
  const store = createSessionEnableStore({ defaultEnabled: true, filePath })
  store.set('sess-9', false)
  await store.persist()
  const text = await readFile(filePath, 'utf8')
  assert.match(text, /"sess-9": false/)

  const reloaded = createSessionEnableStore({ defaultEnabled: true, filePath })
  await reloaded.load()
  assert.equal(reloaded.isEnabledById('sess-9'), false)
})

test('in-memory writes win over a later disk load', async () => {
  const filePath = join(await mkdtemp(join(tmpdir(), 'nowledge-mem-enable-')), 'session-enabled.json')
  const disk = createSessionEnableStore({ filePath })
  disk.set('sess-1', false)
  await disk.persist()

  const live = createSessionEnableStore({ filePath })
  live.set('sess-1', true)
  await live.load()
  assert.equal(live.isEnabledById('sess-1'), true)
})
