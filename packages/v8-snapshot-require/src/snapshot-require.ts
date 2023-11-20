import debug from 'debug'
import path from 'path'
import type {
  GetModuleKey,
  GetModuleKeyOpts,
  ModuleNeedsReload,
  PackherdTranspileOpts,
} from '@packages/packherd-require'
import { packherdRequire } from '@packages/packherd-require'
import type { Snapshot, DependencyMapArray } from './types'
import { forwardSlash } from './utils'
import Module from 'module'
import { DependencyMap } from './dependency-map'

export * from './types'

const logInfo = debug('cypress:snapshot:info')
const logError = debug('cypress:snapshot:error')
const logDebug = debug('cypress:snapshot:debug')

const RESOLVER_MAP_KEY_SEP = '***'

/**
 * Creates the function which tries to obtain the module key for a given module
 * uri.
 *
 * @param resolverMap the {@link Map} of a map from directory to module key
 * which was prepared during snapshotting and embedded into it
 * @private
 */
function createGetModuleKey (resolverMap?: Record<string, string>) {
  /**
   * Attempts to find the module key from the resolver map if we can find a key
   * for the relative dir of the module importing the module uri.
   *
   * This requires that the `opts.path` or `opts.relPath` is provided (in this
   * these paths represent the location of the module that is importing the
   * uri).
   *
   * @param moduleUri expected to be forward slashed regardless of which OS
   * we're running on as the resolver map also only includes forward slashed paths
   * @param baseDir project base dir
   * @param opts {@link GetModuleKeyOpts}
   */
  const getModuleKey: GetModuleKey = ({ moduleUri, baseDir, opts }) => {
    // We can only reliably resolve modules without the Node.js machinery if we can find it in the
    // resolver map. For instance resolving `./util` involves probing the file system to resolve to
    // either `util.js`, `util.json` or possibly `util/index.js`
    // We could make an assumption that `./util.js` resolves to that file, but it could also refer
    // to `./util.js/index.js`
    // The same is true even if `path.isAbsolute` is given, i.e. `/Volumes/dev/util.js` could either be
    // a file or a directory, so we still couldn't be sure.
    if (resolverMap == null || opts == null) {
      return { moduleKey: undefined, moduleRelativePath: undefined }
    }

    // Wrap result in order to keep forward slashes going
    const relParentDir = forwardSlash(
      opts.relPath ?? path.relative(baseDir, opts.path),
    )
    const resolverKey = `${relParentDir}${RESOLVER_MAP_KEY_SEP}${moduleUri}`

    const resolved = resolverMap[resolverKey]

    // Module cache prefixes with `./` while the resolver map doesn't
    if (resolved != null) {
      const moduleKey = `./${resolved}`

      return { moduleKey, moduleRelativePath: moduleKey }
    }

    return { moduleKey: undefined, moduleRelativePath: undefined }
  }

  return getModuleKey
}

/**
 * Creates the predicate that determines if a module needs to be reloaded or if
 * it can be pulled from either the Node.js module cache or our exports cache,
 * embedded in the snapshot.
 *
 * @param dependencyMapArray the dependency map embedded in the snapshot
 * @param projectBaseDir the root of the project
 * @private
 */
function createModuleNeedsReload (
  dependencyMapArray: DependencyMapArray,
  projectBaseDir: string,
) {
  const map = DependencyMap.fromDepArrayAndBaseDir(
    dependencyMapArray,
    projectBaseDir,
  )

  // NOTE: that all keys as well as moduleId are native slashed in order to normalize
  // on Node.js Module._cache which is provided here as the `moduleCache`
  /**
   * Determines if a module needs to be reloaded.
   *
   * @param moduleId the id of the module
   * @param loadedModules modules that we tracked as loaded
   * @param moduleCache the Node.js module cache
   */
  const moduleNeedsReload: ModuleNeedsReload = (
    moduleId: string,
    loadedModules: Set<string>,
    moduleCache: Record<string, NodeModule>,
  ) => {
    if (moduleCache[moduleId] != null) return false

    return (
      map.loadedButNotCached(moduleId, loadedModules, moduleCache) ||
      map.criticalDependencyLoadedButNotCached(
        moduleId,
        loadedModules,
        moduleCache,
      )
    )
  }

  return moduleNeedsReload
}

/**
 * Configures the setup of the require hook.
 *
 * @property useCache if `true` we use the cached module exports and definitions embedded in the snapshot
 * @property diagnosticsEnabled toggles diagnosticsEnabled
 * @property snapshotOverride if set overrides the exports and definitions
 * embedded in the snapshot
 * @property requireStatsFile if set require stats are written to this file
 * @property transpileOpts configures {@link
 * https://github.com/thlorenz/packherd | packherd} TypeScript transpilation
 * @property alwaysHook if `true` we hook `Module._load` even if no embedded snapshot is found
 */
export type SnapshotRequireOpts = {
  useCache?: boolean
  diagnosticsEnabled?: boolean
  snapshotOverride?: Snapshot
  requireStatsFile?: string
  transpileOpts?: PackherdTranspileOpts
  alwaysHook?: boolean
}

const DEFAULT_SNAPSHOT_REQUIRE_OPTS = {
  useCache: true,
  diagnosticsEnabled: false,
  alwaysHook: true,
}

/**
 * Attempts to extract the exports and definitions from the snapshot
 */
function getCaches (sr: Snapshot | undefined, useCache: boolean) {
  if (typeof sr !== 'undefined') {
    return {
      moduleExports: useCache ? sr.customRequire.exports : undefined,
      moduleDefinitions: sr.customRequire.definitions,
    }
  }

  return { moduleExports: {}, moduleDefinitions: {} }
}

/**
 * Sets up the require hook to use assets embedded in the snapshot.
 *
 * @param projectBaseDir project root
 * @param opts configure how the hook is setup and how it behaves
 */
export function snapshotRequire (
  projectBaseDir: string,
  opts: SnapshotRequireOpts = {},
) {
  const { useCache, diagnosticsEnabled, alwaysHook } = Object.assign(
    {},
    DEFAULT_SNAPSHOT_REQUIRE_OPTS,
    opts,
  )
  // 1. Assign snapshot which is a global if it was embedded
  const sr: Snapshot =
    opts.snapshotOverride ||
    // @ts-ignore global getSnapshotResult
    (typeof getSnapshotResult !== 'undefined' ? getSnapshotResult() : undefined)

  // If we have no snapshot we don't need to hook anything
  if (sr != null || alwaysHook) {
    // 2. Pull out our exports and definitions embedded inside the snapshot
    const { moduleExports, moduleDefinitions } = getCaches(sr, useCache)

    // 3. Provide some info about what we found
    const cacheKeys = Object.keys(moduleExports || {})
    const defKeys = Object.keys(moduleDefinitions)

    logInfo(
      'Caching %d, defining %d modules! %s cache',
      cacheKeys.length,
      defKeys.length,
      useCache ? 'Using' : 'Not using',
    )

    logDebug('initializing packherd require')

    // 4. Attempt to pull out the resolver map as well as the dependency map
    let resolverMap: Record<string, string> | undefined
    let moduleNeedsReload: ModuleNeedsReload | undefined

    // @ts-ignore global snapshotAuxiliaryData
    resolverMap = sr.snapshotAuxiliaryData.resolverMap
    // @ts-ignore global snapshotAuxiliaryData
    const dependencyMapArray: DependencyMapArray = sr.snapshotAuxiliaryData.dependencyMapArray

    // 5. Setup the module needs reload predicate with the dependency map
    if (dependencyMapArray != null) {
      moduleNeedsReload = createModuleNeedsReload(
        dependencyMapArray,
        projectBaseDir,
      )
    }

    // 6. Setup the module key resolver with the resolver map
    const getModuleKey = createGetModuleKey(resolverMap)

    // 7. Use packherd to hook Node.js require and get hold of some callbacks
    //    to interact with packherd's module loading mechanism
    const { resolve, shouldBypassCache, registerModuleLoad, tryLoad } =
      packherdRequire(projectBaseDir, {
        diagnosticsEnabled,
        moduleExports,
        moduleDefinitions,
        getModuleKey,
        requireStatsFile: opts.requireStatsFile,
        transpileOpts: opts.transpileOpts,
        moduleNeedsReload,
      })

    if (typeof sr !== 'undefined') {
      const projectBaseDir = process.env.PROJECT_BASE_DIR

      if (projectBaseDir == null) {
        throw new Error(
          'Please provide the \'PROJECT_BASE_DIR\' env var.\n' +
            'This is the same used when creating the snapshot.\n' +
            'Example: PROJECT_BASE_DIR=`pwd` yarn dev',
        )
      }

      // 9. Setup the path resolver that is used from inside the snapshot in
      //    order to resolve full paths of modules
      const pathResolver = {
        resolve (p: string) {
          try {
            return path.resolve(projectBaseDir, p)
          } catch (err) {
            logError(err)
          }

          return
        },
      }

      // -----------------
      // Snapshot Globals
      // -----------------
      // While creating the snapshot we use stubs for globals like process.
      // When we execute code that is inside the snapshot we need to ensure
      // that it is using the actual instances. We do this by swapping out the
      // stubs with the those instances.
      // For more info see ../blueprint/set-globals.js

      // 10. Prepare the globals we need to inject into the snapshot

      // The below aren't available in all environments
      const checked_process: any =
        typeof process !== 'undefined' ? process : undefined
      const checked_window: any =
        // @ts-ignore ignore window as it's something that will only be available at runtime
        typeof window !== 'undefined' ? window : undefined
      const checked_document: any =
        // @ts-ignore ignore document as it's something that will only be available at runtime
        typeof document !== 'undefined' ? document : undefined

      // 11. Inject those globals

      // @ts-ignore setGlobals is a function on global sr
      sr.setGlobals(
        global,
        checked_process,
        checked_window,
        checked_document,
        console,
        pathResolver,
        require,
      )

      // 11. Setup the customRequire inside the snapshot

      // @ts-ignore private module var
      require.cache = Module._cache
      // @ts-ignore customRequire is a property of global sr
      sr.customRequire.cache = require.cache

      // 12. Add some 'magic' functions that we can use from inside the
      //    snapshot in order to integrate module loading
      //    See ../blueprint/custom-require.js

      // @ts-ignore custom method on require
      require._tryLoad = tryLoad
      const oldRequireResolve = require.resolve

      // @ts-ignore opts not exactly matching
      require.resolve = function (id: string, opts: GetModuleKeyOpts & { paths?: string[] | undefined } | undefined) {
        if (opts?.fromSnapshot) {
          return resolve(id, opts)
        }

        return oldRequireResolve(id, opts)
      }

      // @ts-ignore custom method on require
      require.shouldBypassCache = shouldBypassCache
      // @ts-ignore custom method on require
      require.registerModuleLoad = registerModuleLoad
      // @ts-ignore custom property on require
      require.builtInModules = new Set(Module.builtinModules)
    }
  }
}
