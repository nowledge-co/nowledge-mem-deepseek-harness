import * as esbuild from 'esbuild'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginId = 'nowledge-mem-deepseek-harness'

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ['src/client/index.js'],
  outfile: 'client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  logLevel: 'info',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(pluginId)}, factory: (require) => {\nvar module = { exports: {} }; var exports = module.exports;\n`,
  },
  footer: {
    js: 'return module.exports; } });\n',
  },
})
