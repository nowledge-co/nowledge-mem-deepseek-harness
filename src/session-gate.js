import { isMemToolName, listMemToolNames, memToolDeniedReason } from './mcp-tools.js'
import { errorMessage, warn } from './sandbox-retry.js'

export function lookupSession(ctx, sessionId) {
  try {
    if (typeof ctx.sessions?.get === 'function') return ctx.sessions.get(sessionId)
  } catch {
    return undefined
  }
  return undefined
}

export function syncMemToolRestriction(ctx, store, agent, restrictionDisposers) {
  const previous = restrictionDisposers.get(agent)
  if (typeof previous === 'function') {
    try { previous() } catch { /* already lifted */ }
    restrictionDisposers.delete(agent)
  }
  const session = agent?.session
  if (session === undefined) return
  if (store.isEnabled(session, id => lookupSession(ctx, id))) return
  const scopedTools = agent.ctx?.tools
  if (typeof scopedTools?.restrict !== 'function') return
  const names = listMemToolNames(ctx.tools ?? scopedTools)
  if (names.length === 0) return
  try {
    restrictionDisposers.set(agent, scopedTools.restrict({ deny: names }))
  } catch (error) {
    warn(ctx, `nowledge-mem: failed to hide Mem tools for a disabled session: ${errorMessage(error)}`)
  }
}

export function attachSessionEnable(ctx, store) {
  const restrictionDisposers = new WeakMap()
  const sessionIsEnabled = session => store.isEnabled(session, id => lookupSession(ctx, id))
  const refreshToolRestrictions = () => {
    if (typeof ctx.agents?.list !== 'function') return
    for (const agent of ctx.agents.list()) syncMemToolRestriction(ctx, store, agent, restrictionDisposers)
  }
  store.subscribe(refreshToolRestrictions)

  const onPreExecute = (exec, next) => {
    if (!isMemToolName(exec?.name)) return next()
    const session = exec.agent?.session
    if (session === undefined || sessionIsEnabled(session)) return next()
    return { kind: 'deny', reason: memToolDeniedReason() }
  }

  if (typeof ctx.on === 'function') {
    ctx.on('agent/created', ({ agent }) => {
      syncMemToolRestriction(ctx, store, agent, restrictionDisposers)
    })
  }

  const listenTools = () => {
    ctx.on('tools/pre-execute', onPreExecute)
    ctx.on('tools/change', refreshToolRestrictions)
  }
  if (typeof ctx.inject === 'function') ctx.inject(['tools'], listenTools)
  else listenTools()

  return { sessionIsEnabled, refreshToolRestrictions, restrictionDisposers }
}
