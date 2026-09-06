/**
 * Layout policy for the composer tools host.
 *
 * One registered item renders as a resident chip (the Nowledge Mem switch
 * today). Two or more items collapse into a Tools dropdown so later switches
 * can join the same menu without crowding the composer tool row.
 */

import {
  COMPOSER_TOOLS_HOST_ID,
  COMPOSER_TOOLS_HOST_SLOT,
  COMPOSER_TOOLS_MEM_ID,
  COMPOSER_TOOLS_MENU_SLOT,
} from './constants.js'

export {
  COMPOSER_TOOLS_HOST_ID,
  COMPOSER_TOOLS_HOST_SLOT,
  COMPOSER_TOOLS_MEM_ID,
  COMPOSER_TOOLS_MENU_SLOT,
}

export function composerToolsLayout(itemCount) {
  if (!Number.isSafeInteger(itemCount) || itemCount <= 0) return 'hidden'
  if (itemCount === 1) return 'chip'
  return 'menu'
}

export function composerToolsMenuSpec() {
  return { kind: 'list', scope: 'session' }
}
