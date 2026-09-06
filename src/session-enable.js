/**
 * Per-session Nowledge Mem switch.
 *
 * The default is on. Explicit overrides live in a JSON file under DSH_HOME so
 * a reload of the same session keeps the user's choice. Child sessions inherit
 * a parent override when they do not have one of their own.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { SESSION_ENABLE_FILENAME } from './constants.js'

export function resolveDshHome(env = process.env) {
  const fromEnv = env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    const trimmed = fromEnv.trim()
    if (trimmed === '~') return resolve(homedir())
    if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
      return resolve(join(homedir(), trimmed.slice(2)))
    }
    return resolve(trimmed)
  }
  return resolve(join(homedir(), '.dsh'))
}

export function sessionEnableFilePath(env = process.env) {
  return join(resolveDshHome(env), 'nowledge-mem', SESSION_ENABLE_FILENAME)
}

export function normalizeSessionId(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function decodeSessionEnableFile(text) {
  const parsed = JSON.parse(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('nowledge-mem: session-enabled file must be a JSON object')
  }
  const sessions = new Map()
  const raw = parsed.sessions
  if (raw !== undefined) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new TypeError('nowledge-mem: session-enabled.sessions must be an object')
    }
    for (const [id, enabled] of Object.entries(raw)) {
      const sessionId = normalizeSessionId(id)
      if (sessionId === undefined || typeof enabled !== 'boolean') continue
      sessions.set(sessionId, enabled)
    }
  }
  return sessions
}

export function encodeSessionEnableFile(sessions) {
  const record = {}
  for (const [id, enabled] of sessions) record[id] = enabled
  return `${JSON.stringify({ version: 1, sessions: record }, null, 2)}\n`
}

export function resolveSessionEnabled(store, session, getSession) {
  const seen = new Set()
  let current = session
  while (current !== undefined && current !== null && typeof current === 'object') {
    const id = normalizeSessionId(current.header?.id)
    if (id === undefined || seen.has(id)) break
    seen.add(id)
    if (store.has(id)) return store.get(id)
    const parentId = normalizeSessionId(current.header?.parentSession)
    if (parentId === undefined) break
    current = typeof getSession === 'function' ? getSession(parentId) : undefined
    if (current === undefined && store.has(parentId)) return store.get(parentId)
  }
  return store.defaultEnabled
}

export function createSessionEnableStore(options = {}) {
  const defaultEnabled = options.defaultEnabled !== false
  const filePath = options.filePath
  const read = options.readFile ?? (path => readFile(path, 'utf8'))
  const write = options.writeFile ?? ((path, data) => writeFile(path, data, { mode: 0o600 }))
  const makeDir = options.mkdir ?? (path => mkdir(path, { recursive: true }))
  const warn = typeof options.warn === 'function' ? options.warn : () => undefined

  const sessions = new Map()
  const listeners = new Set()
  let persistTail = Promise.resolve()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  const persist = () => {
    if (filePath === undefined) return
    persistTail = persistTail.catch(() => undefined).then(async () => {
      try {
        await makeDir(dirname(filePath))
        await write(filePath, encodeSessionEnableFile(sessions))
      } catch (error) {
        warn(`nowledge-mem: failed to persist session enable overrides: ${error instanceof Error ? error.message : String(error)}`)
      }
    })
    return persistTail
  }

  const store = {
    defaultEnabled,
    has(id) {
      const sessionId = normalizeSessionId(id)
      return sessionId !== undefined && sessions.has(sessionId)
    },
    get(id) {
      const sessionId = normalizeSessionId(id)
      return sessionId === undefined ? undefined : sessions.get(sessionId)
    },
    set(id, enabled) {
      const sessionId = normalizeSessionId(id)
      if (sessionId === undefined) {
        throw new TypeError('nowledge-mem: sessionId is required')
      }
      if (typeof enabled !== 'boolean') {
        throw new TypeError('nowledge-mem: enabled must be a boolean')
      }
      if (sessions.get(sessionId) === enabled) return store
      sessions.set(sessionId, enabled)
      notify()
      void persist()
      return store
    },
    isEnabled(session, getSession) {
      return resolveSessionEnabled(store, session, getSession)
    },
    isEnabledById(sessionId, getSession) {
      const id = normalizeSessionId(sessionId)
      if (id === undefined) return defaultEnabled
      if (sessions.has(id)) return sessions.get(id)
      const session = typeof getSession === 'function' ? getSession(id) : undefined
      if (session !== undefined) return resolveSessionEnabled(store, session, getSession)
      return defaultEnabled
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async load() {
      if (filePath === undefined) return store
      try {
        const loaded = decodeSessionEnableFile(await read(filePath))
        for (const [id, enabled] of loaded) {
          if (!sessions.has(id)) sessions.set(id, enabled)
        }
        notify()
      } catch (error) {
        if (error !== undefined && error !== null && error.code === 'ENOENT') return store
        warn(`nowledge-mem: failed to load session enable overrides: ${error instanceof Error ? error.message : String(error)}`)
      }
      return store
    },
    persist,
  }

  return store
}
