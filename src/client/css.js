export const STYLE_ID = 'dsh-nowledge-mem-css'

export const PLUGIN_CSS = `
[data-dsh-nowledge-mem] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 52px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg, rgb(255 255 255 / 0.04));
  color: var(--dsw-alias-label-secondary, #c8c8c8);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease, opacity 120ms ease, border-color 120ms ease;
}
[data-dsh-nowledge-mem]::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.45;
  transition: opacity 120ms ease, box-shadow 120ms ease;
}
[data-dsh-nowledge-mem]:hover:not(:disabled),
[data-dsh-nowledge-mem]:focus-visible:not(:disabled) {
  color: var(--dsw-alias-label-secondary, #555);
  background: var(--dsw-alias-interactive-bg-hover, rgb(0 0 0 / 0.06));
  outline: none;
}
[data-dsh-nowledge-mem][aria-pressed='true'] {
  color: var(--dsw-alias-state-business-primary, #00a3a3);
  background: color-mix(in srgb, currentColor 12%, transparent);
}
[data-dsh-nowledge-mem][aria-pressed='true']::before {
  opacity: 1;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent);
}
[data-dsh-nowledge-mem]:disabled {
  opacity: 0.45;
  cursor: default;
}
[data-dsh-nowledge-mem][data-error='true'] {
  color: var(--dsw-alias-label-danger, #c43d3d);
}
[data-dsh-composer-tools] {
  position: relative;
  display: inline-flex;
  align-items: center;
}
[data-dsh-composer-tools-trigger] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg, rgb(255 255 255 / 0.04));
  color: var(--dsw-alias-label-secondary, #c8c8c8);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
[data-dsh-composer-tools-trigger][aria-expanded='true'],
[data-dsh-composer-tools-trigger]:hover,
[data-dsh-composer-tools-trigger]:focus-visible {
  color: var(--dsw-alias-label-primary, #eee);
  outline: none;
}
[data-dsh-composer-tools-menu] {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  z-index: 40;
  min-width: 220px;
  padding: 6px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 12px;
  background: var(--dsw-alias-bg-elevated, #1c1c1c);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.28);
}
[data-dsh-nowledge-mem-row] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 8px;
  color: var(--dsw-alias-label-primary, #eee);
  font: inherit;
  font-size: 13px;
}
`

export function installCss(doc = document) {
  if (doc.getElementById(STYLE_ID)) return
  const tag = doc.createElement('style')
  tag.id = STYLE_ID
  tag.dataset.plugin = 'nowledge-mem-deepseek-harness'
  tag.textContent = PLUGIN_CSS
  doc.head.appendChild(tag)
}
