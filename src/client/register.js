import {
  COMPOSER_TOOLS_HOST_ID,
  COMPOSER_TOOLS_HOST_SLOT,
  COMPOSER_TOOLS_MEM_ID,
  COMPOSER_TOOLS_MENU_SLOT,
  composerToolsMenuSpec,
} from '../composer-tools.js'

export function registerComposerTools(ctx, { Host, Item }) {
  ctx.slots.inject(COMPOSER_TOOLS_HOST_SLOT, () => ctx.slots.register({
    name: COMPOSER_TOOLS_HOST_SLOT,
    id: COMPOSER_TOOLS_HOST_ID,
    order: 40,
    label: 'Tools',
    children: {
      [COMPOSER_TOOLS_MENU_SLOT]: composerToolsMenuSpec(),
    },
    inject: sessionId => ({
      sessionId,
      slots: ctx.slots,
      subscribeMenu: listener => {
        if (typeof ctx.on !== 'function') return () => {}
        return ctx.on('slots/changed', key => {
          if (key === COMPOSER_TOOLS_MENU_SLOT) listener()
        })
      },
    }),
  }, Host))

  ctx.slots.inject(COMPOSER_TOOLS_MENU_SLOT, () => ctx.slots.register({
    name: COMPOSER_TOOLS_MENU_SLOT,
    id: COMPOSER_TOOLS_MEM_ID,
    order: 0,
    label: 'Nowledge Mem',
    inject: sessionId => ({ sessionId }),
  }, Item))
}
