import debug from 'debug'
import { DefaultTranspileCache } from './default-transpile-cache'
import {
  GetModuleKeyOpts,
  ModuleLoaderOpts,
  PackherdModuleLoader,
} from './loader'
import type {
  ModuleNeedsReload,
  PackherdTranspileOpts,
} from './types'
import path from 'path'

const logInfo = debug('cypress-verbose:packherd:info')
const logDebug = debug('cypress-verbose:packherd:debug')
const logTrace = debug('cypress-verbose:packherd:trace')
const logError = debug('cypress:packherd:error')

export * from './loader'

export * from './types'

/**
 * Configures how packherd require works.
 *
 * @property requireStatsFile: specifies where to write benchmarking stats if diagnose is active
 * @property transpileOpts: configures if/how TypeScript files are transpiled
 * @property sourceMapLookup: if provided it will be used to find sourcemaps by module URI
 * @property moduleNeedsReload: allows to override how packherd determines if a
 * module needs to be reloaded even if found in a cache
 * @category Loader
 */
export type PackherdRequireOpts = ModuleLoaderOpts & {
  requireStatsFile?: string
  transpileOpts?: Partial<PackherdTranspileOpts>
  moduleNeedsReload?: ModuleNeedsReload
}

const DEFAULT_TRANSPILE_OPTS = {
  supportTS: false,
}

/**
 * Patches Node.js require chain in order to load modules from different sources
 * and/or transpile TypeScript modules on the fly.
 *
 * Hooks into `Module_.load` if either {@link ModuleLoaderOpts} `moduleExports`
 * or `moduleDefinitions` or both are provided.
 * It will then try to load modules from either of those two before falling
 * back to the default Node.js behavior and loading them from the file system.
 *
 * Optionally hooks into `Module._extension` in order to transpile TypeScript files as
 * they are required/imported.
 *
 * @returns a variety of functions which allow to communicate with the loader:
 *
 *   - resolve: function to resolve a module from it's URI
 *   - shouldBypassCache: returns `true` if a cache, i.e. exports embedded in the
 *     snapshot cannot by used
 *   - registerModuleLoad: allows registering modules being loaded even if that
 *     occurs from inside a snapshot
 *  - registerModuleLoad: needs to be called to track loaded modules which is
 *    necessary to determine if cache should be bypassed or not
 *
 * These are used by [v8-snapshot](https://github.com/thlorenz/v8-snapshot)
 * from the `require` embedded in its snapshot, see [custom-require](https://github.com/thlorenz/v8-snapshot/blob/master/src/blueprint/custom-require.js).
 *
 * @category Loader
 */
export function packherdRequire (
  projectBaseDir: string,
  opts: PackherdRequireOpts,
) {
  const Module = require('module')

  const { supportTS, initTranspileCache, tsconfig } = Object.assign(
    {},
    DEFAULT_TRANSPILE_OPTS,
    opts.transpileOpts,
  )
  const diagnosticsEnabled = opts.diagnosticsEnabled ?? false

  const cache =
    initTranspileCache == null
      ? new DefaultTranspileCache()
      : initTranspileCache(projectBaseDir, {
        // even though we pass `cacheDir` here other end may store the cache wherever it wants
        cacheDir: '/tmp/packherd-cache',
      }) ?? new DefaultTranspileCache()

  if (supportTS) {
    logInfo('Enabling TS support')
    logDebug({ supportTS, initTranspileCache, tsconfig })
    const { hookTranspileTs } = require('./transpile-ts')

    hookTranspileTs(
      Module,
      projectBaseDir,
      logInfo,
      diagnosticsEnabled,
      cache,
      tsconfig,
    )
  }

  const exportKeysLen =
    opts.moduleExports != null ? Object.keys(opts.moduleExports).length : 0
  const definitionKeysLen =
    opts.moduleDefinitions != null
      ? Object.keys(opts.moduleDefinitions).length
      : 0

  logInfo(
    'packherd defining %d exports and %d definitions!',
    exportKeysLen,
    definitionKeysLen,
  )

  logInfo({ projectBaseDir })

  // Even though packherd is designed to support loading from these caches we
  // also support using it for on the fly TypeScript transpilation only.
  // In that case the necessary extensions hook was applied above and no
  // further work is needed.
  if (exportKeysLen === 0 && definitionKeysLen === 0) {
    logInfo(
      'No moduleExports nor moduleDefinitions provided, not hooking Module._load',
    )

    return { resolve: require.resolve.bind(require) }
  }

  const origLoad = Module._load

  const moduleLoader = new PackherdModuleLoader(
    Module,
    origLoad,
    projectBaseDir,
    opts,
  )

  //
  // Module._load override
  //
  Module._load = function (
    moduleUri: string,
    parent: typeof Module,
    isMain: boolean,
  ) {
    logTrace('Module._load "%s"', moduleUri)
    if (Module.builtinModules.includes(moduleUri)) {
      return origLoad(moduleUri, parent, isMain)
    }

    try {
      const { resolved, origin, exports, fullPath } = moduleLoader.tryLoad(
        moduleUri,
        parent,
        isMain,
      )
      const moduleRelativePath = path.relative(projectBaseDir, fullPath)

      switch (resolved) {
        case 'module:node':
        case 'module-uri:node':
        case 'module-fullpath:node':
        case 'module-key:node':
        case 'cache:node': {
          logTrace(
            'Resolved "%s" via %s (%s | %s)',
            moduleUri,
            resolved,
            moduleRelativePath,
            fullPath,
          )

          break
        }
        default:
          // No need to do anything
      }

      switch (origin) {
        case 'Module._load': {
          logTrace(
            'Loaded "%s" via %s resolved as (%s | %s)',
            moduleUri,
            origin,
            moduleRelativePath,
            fullPath,
          )

          break
        }
        case 'packherd:export':
        case 'packherd:definition': {
          logTrace('Loaded "%s" via (%s | %s)', moduleUri, origin, resolved)
          break
        }
        default:
          // No need to do anything
      }

      return exports
    } catch (err) {
      if (diagnosticsEnabled && !moduleUri.endsWith('hook-require')) {
        logError(err)
      }

      throw err
    }
  }

  return {
    resolve (uri: string, opts?: GetModuleKeyOpts) {
      return moduleLoader.tryResolve(uri, opts).fullPath
    },
    shouldBypassCache: moduleLoader.shouldBypassCache.bind(moduleLoader),
    registerModuleLoad: moduleLoader.registerModuleLoad.bind(moduleLoader),
    tryLoad: moduleLoader.tryLoad.bind(moduleLoader),
  }
}
