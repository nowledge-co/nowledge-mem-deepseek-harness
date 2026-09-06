import { createElement as h, useEffect, useState, useSyncExternalStore } from 'react'

import { COMPOSER_TOOLS_MENU_SLOT, composerToolsLayout } from '../composer-tools.js'

function ToolsDropdown({ children }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = event => {
      const host = event.target instanceof Element
        ? event.target.closest('[data-dsh-composer-tools]')
        : null
      if (host === null) setOpen(false)
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return h('div', { 'data-dsh-composer-tools': true },
    h('button', {
      type: 'button',
      'data-dsh-composer-tools-trigger': true,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      'aria-label': 'Session tools',
      title: 'Session tools',
      onClick: () => { setOpen(value => !value) },
    }, 'Tools'),
    open
      ? h('div', {
        role: 'menu',
        'data-dsh-composer-tools-menu': true,
      }, children)
      : null,
  )
}

export function ComposerToolsHost({ renderSlot, sessionId, slots, subscribeMenu }) {
  const itemCount = useSyncExternalStore(
    listener => (typeof subscribeMenu === 'function' ? subscribeMenu(listener) : () => {}),
    () => slots?.entries?.(COMPOSER_TOOLS_MENU_SLOT)?.length ?? 1,
    () => slots?.entries?.(COMPOSER_TOOLS_MENU_SLOT)?.length ?? 1,
  )
  const layout = composerToolsLayout(itemCount)
  if (layout === 'hidden' || typeof renderSlot !== 'function') return null
  const items = renderSlot(COMPOSER_TOOLS_MENU_SLOT, {
    variant: layout === 'menu' ? 'row' : 'chip',
    sessionId,
  })
  if (layout === 'chip') return items
  return h(ToolsDropdown, null, items)
}
