import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

test('committed client bundle is a DSH module factory', async () => {
  const text = await readFile(join(dirname(fileURLToPath(import.meta.url)), '../client.js'), 'utf8')
  assert.match(text, /window\.__ModuleLoader__\.load\(\{ id: "nowledge-mem-deepseek-harness"/)
  assert.match(text, /conversation\.input\.left/)
  assert.match(text, /conversation\.input\.tools\.menu/)
  assert.match(text, /data-dsh-nowledge-mem/)
  assert.match(text, /return module\.exports; \} \}\);/)
})

test('client factory exports apply and inject', async () => {
  const text = await readFile(join(dirname(fileURLToPath(import.meta.url)), '../client.js'), 'utf8')
  let exported
  const previousWindow = globalThis.window
  globalThis.window = {
    __ModuleLoader__: {
      load({ factory }) {
        exported = factory(specifier => {
          if (specifier === 'react') {
            return {
              createElement() { return null },
              useEffect() {},
              useState(value) { return [value, () => {}] },
              useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot() },
            }
          }
          throw new Error(`unexpected require: ${specifier}`)
        })
      },
    },
  }
  try {
    // eslint-disable-next-line no-new-func
    new Function(text)()
    assert.equal(typeof exported.apply, 'function')
    assert.deepEqual(exported.inject, ['slots'])
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
