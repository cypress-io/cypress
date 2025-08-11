import type { Debugger } from 'debug'
import { TransformOptions, transformSync } from 'esbuild'
import type { TranspileCache } from './types'
import path from 'path'
import { installSourcemapSupport } from './sourcemap-support'

type EnhancedModule = NodeModule & {
  _extensions: Record<string, (mod: EnhancedModule, filename: string) => void>
  _compile: (code: string, filename: string) => unknown
  _cache: Record<string, NodeModule>
}

const DEFAULT_TRANSFORM_OPTS: TransformOptions = {
  target: ['node14.5'],
  loader: 'ts',
  format: 'cjs',
  sourcemap: 'inline',
  minify: false,
  supported: {
    // We won't be supporting dynamic imports since everything we're doing gets bundled into one snapshot anyway
    'dynamic-import': false,
  },
}

function transpileTsCode (
  fullModuleUri: string,
  ts: string,
  cache: TranspileCache,
  projectBaseDir: string,
  // TODO: consider 'error' for importsNotUsedAsValues (maybe) to add some type checking
  tsconfig?: TransformOptions['tsconfigRaw'],
): string {
  installSourcemapSupport(cache, projectBaseDir)

  // Try to get from cache first
  const cached = (cache != null && cache.get(fullModuleUri)) || null

  if (cached != null) return cached

  // Transpile
  const opts = Object.assign({}, DEFAULT_TRANSFORM_OPTS, {
    tsconfigRaw: tsconfig,
    sourcefile: fullModuleUri,
  })
  const result = transformSync(ts, opts)

  // Add to Cache
  if (cache != null) {
    cache.add(fullModuleUri, result.code)
  }

  return result.code
}

/**
 * Hooks into `Module._extensions` in order to transpile TypeScript modules on the fly.
 *
 * @param Module the Node.js Module
 * @param projectBaseDir root of the project
 * @param log `debug` module logger to use
 * @param diagnosticsEnabled if `true` in case of a transpile/compile error the app breaks when run in the debugger
 * @param cache used to avoid re-transpiling modules that haven't changed since last transpile
 * @param sourceMapLookup allows overriding how a sourcemap for a particular `uri` is retrieved
 * @param tsconfig overrides tsconfig passed to esbuild
 *
 * @category Transpilation
 */
export function hookTranspileTs (
  Module: EnhancedModule,
  projectBaseDir: string,
  log: Debugger,
  diagnosticsEnabled: boolean,
  cache: TranspileCache,
  tsconfig?: TransformOptions['tsconfigRaw'],
) {
  installSourcemapSupport(cache, projectBaseDir)

  const defaultLoader = Module._extensions['.js']

  Module._extensions['.ts'] = function (mod: EnhancedModule, filename: string) {
    const origCompile = mod._compile

    // NOTE: I benchmarked bypassing the loader to avoid reading `code`
    // that goes unused in case the transpiled version is already in the cache.
    // That optimization does not make a notable difference and thus we opt of
    // the more robust approach of using the Node.js builtin compile which also
    // provides internal Node.js cache checks.
    mod._compile = (code: string) => {
      mod._compile = origCompile
      try {
        log('transpiling %s', path.relative(projectBaseDir, filename))

        const transpiled = transpileTsCode(
          filename,
          code,
          cache,
          projectBaseDir,
          tsconfig,
        )

        const compiled: NodeModule = mod._compile(
          transpiled,
          filename,
        ) as NodeModule

        return compiled
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        if (diagnosticsEnabled) {
          // eslint-disable-next-line no-debugger
          debugger
        }

        return mod._compile(code, filename)
      }
    }

    defaultLoader(mod, filename)
  }
}
