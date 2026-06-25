import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { minify } from 'terser'

// Minify the assembled page script. The bundle is dominated by the full (unminified) lodash that
// network-tools pulls in via a default import; terser shrinks that (and everything else) hard.
const minifyBundle = {
  name: 'minify-bundle',
  async renderChunk (code: string) {
    // NOT module:true — the chunk is an IIFE (classic script) that exposes the global
    // `CypressInjection`. In module mode, terser treats that top-level binding as a manglable
    // module-local and renames it, breaking the `CypressInjection.injectAutBridge(...)` call the
    // adapter's wrapper makes. Script mode keeps top-level/global names intact.
    const result = await minify(code, { module: false, toplevel: false })

    return result.code ? { code: result.code, map: (result.map as string) ?? null } : null
  },
}

// The package's deliverable is the assembled page script AS A STRING — consumers inject it into the
// AUT over their transport (CDP, etc), they don't import its functions. So wrap the built bundle as a
// default-exported string and emit a matching declaration, so consumers get `string` typing instead
// of an untyped default import.
const emitScriptAsDefaultString = {
  name: 'emit-script-as-default-string',
  generateBundle (_outputOptions: unknown, bundle: Record<string, any>) {
    const chunk = bundle['index.js']

    if (!chunk || chunk.type !== 'chunk') {
      return
    }

    chunk.code = `export default ${JSON.stringify(chunk.code)}\n`

    this.emitFile({
      type: 'asset',
      fileName: 'index.d.ts',
      source: 'declare const AutInjectionScript: string\n\nexport default AutInjectionScript\n',
    })
  },
}

const config = [
  {
    input: 'lib/index.ts',
    output: {
      file: 'dist/index.js',
      // iife (not esm) so the stringified script runs as a classic injected script and exposes
      // its exports on a global the closure wrapper can call (CypressInjection.injectAutBridge).
      format: 'iife',
      name: 'CypressInjection',
    },
    plugins: [
      // resolve bare specifiers so their code is pulled into the bundle. browser:true picks
      // packages' browser entries (e.g. debug -> browser.js) so we don't drag in Node built-ins
      // like tty/util that can't run in the page; preferBuiltins:false so any stray builtin errors
      // the build instead of being left as an unresolvable bare import.
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      // some transitive deps (e.g. parse-domain) import package.json
      json(),
      typescript({
        tsconfig: 'tsconfig.browser.json',
      }),
      // keep last so it minifies the fully-assembled bundle
      minifyBundle,
      // wrap the assembled bundle as a default-exported string + emit its .d.ts; keep after minify
      emitScriptAsDefaultString,
    ],
  },
]

export default config
