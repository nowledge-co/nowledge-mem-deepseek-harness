/**
 * Browser half: a per-session Nowledge Mem switch in the composer tool row.
 *
 * The switch is registered through a Tools menu host so later session-scoped
 * toggles can join the same dropdown without each taking a chip of its own.
 */

import { ComposerToolsHost } from './ToolsMenu.js'
import { MemToggle } from './MemToggle.js'
import { installCss } from './css.js'
import { registerComposerTools } from './register.js'

export const inject = ['slots']

export function apply(ctx) {
  installCss()
  registerComposerTools(ctx, {
    Host: ComposerToolsHost,
    Item: MemToggle,
  })
}
