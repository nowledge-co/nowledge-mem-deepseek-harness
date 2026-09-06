import { createElement as h, useEffect, useState } from 'react'

import { fetchSessionEnable, putSessionEnable } from './api.js'

function labelFor(enabled) {
  return enabled ? 'Nowledge Mem is on for this session' : 'Nowledge Mem is off for this session'
}

export function MemToggle({ sessionId, variant = 'chip' }) {
  const [enabled, setEnabled] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sessionId === undefined) return undefined
    let cancelled = false
    setPending(true)
    fetchSessionEnable(sessionId)
      .then(snapshot => {
        if (cancelled) return
        setEnabled(snapshot.enabled === true)
        setError(null)
      })
      .catch(cause => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const toggle = async () => {
    if (sessionId === undefined || pending) return
    const next = !enabled
    setPending(true)
    setError(null)
    setEnabled(next)
    try {
      const snapshot = await putSessionEnable(sessionId, next)
      setEnabled(snapshot.enabled === true)
    } catch (cause) {
      setEnabled(!next)
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setPending(false)
    }
  }

  const title = error ?? labelFor(enabled)
  const disabled = pending || sessionId === undefined

  if (variant === 'row') {
    return h('div', { 'data-dsh-nowledge-mem-row': true },
      h('span', null, 'Nowledge Mem'),
      h('button', {
        type: 'button',
        role: 'switch',
        'data-dsh-nowledge-mem': true,
        'aria-checked': enabled,
        'aria-pressed': enabled,
        'aria-label': labelFor(enabled),
        title,
        disabled,
        'data-error': error === null ? undefined : 'true',
        onClick: () => { void toggle() },
      }, enabled ? 'On' : 'Off'),
    )
  }

  return h('button', {
    type: 'button',
    'data-dsh-nowledge-mem': true,
    'aria-pressed': enabled,
    'aria-label': labelFor(enabled),
    title,
    disabled,
    'data-error': error === null ? undefined : 'true',
    onClick: () => { void toggle() },
  }, 'Mem')
}
