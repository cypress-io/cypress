import type {
  TransformOptions,
} from 'esbuild'

import type { SourceMapConsumer } from 'source-map-js'

// -----------------
// Loading/Require
// -----------------
type NodeRequireFunction = (id: string) => any

/**
 * The function that needs to be called in order to instantiate a Node.js module definition.
 * Invoking it results in a `NodeModule`. The `exports` and `module` will be initialized as if the module was being
 * `require`d.
 *
 * module definitions need to be provided to {import('./require').packherdRequire}
 *
 * @category Loader
 */
export type ModuleDefinition = (
  exports: NodeModule['exports'],
  module: { exports: NodeModule['exports'] },
  __filename: string,
  __dirname: string,
  require: NodeRequireFunction
) => NodeModule

/**
 * The result of attempting a requested `URI` to a full path.
 * @property resolved: indicates how the module was resolved
 *  - 'module:node': resolved via Node.js module resolution which requires I/O
 *  - 'module-uri:node': uri was already a full path
 *  - 'module-fullpath:node': resolved relative to parent
 *  - 'cache:direct': resolved directly from `packherd` module export cache
 *  - 'cache:node': resolved from cache after determining full path via Node.js
 * @property fullPath: full path to the resolved module
 *
 * @private
 * @category Loader
 */
export type ModuleResolveResult = {
  resolved:
  | 'module:node'
  | 'module-uri:node'
  | 'module-fullpath:node'
  | 'module-key:node'
  | 'cache:direct'
  | 'cache:node'
  fullPath: string
}

/**
 * Result of loading a module via packherd.
 *
 * @property exports: the `exports` of the module
 * @property origin: indicates how the exports were retrieved
 *  - ''packherd:export': directly from the fully instantiated exports provided to packherd
 *  - 'packherd:definition': by invoking on of the provided definitions
 *  - 'Module._cache' loaded from Node.js module cache
 *  - 'Module._load' by calling Node.js module load method which requires I/O
 *
 * @private
 * @category Loader
 */
export type ModuleLoadResult = ModuleResolveResult & {
  exports: NodeModule['exports']
  origin:
  | 'packherd:export'
  | 'packherd:definition'
  | 'Module._cache'
  | 'Module._load'
}

/**
 * The Node.js Module builtin including some private methods that we depend on in packherd.
 * @category Loader
 */
export type ModuleBuiltin = typeof import('module') & {
  _resolveFilename(
    moduleUri: string,
    parent: NodeModule | undefined,
    isMain: boolean
  ): string
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean
  ): NodeModule
  _cache: Record<string, NodeModule>
}

/**
 * Predicate part of loader opts which specifies how to determine if a module should be reloaded
 * even though it could be loaded from a cache.
 *
 * @category Loader
 */
export type ModuleNeedsReload = (
  moduleId: string,
  loadedModules: Set<string>,
  moduleCache: Record<string, NodeModule>
) => boolean

// -----------------
// Transpilation
// -----------------
/**
 * Interface to the cache used to store/retrieve transpiled TypeScript
 *
 * This interface matches DirtSimpleFileCache
 *
 * @category Transpilation */
export interface TranspileCache {
  get(fullPath: string): string | undefined
  addAsync(origFullPath: string, convertedContent: string): Promise<void>
  add(origFullPath: string, convertedContent: string): void
  clearSync(): void
}

/** @category Transpilation */
export type TranspileCacheOpts = {
  cacheDir: string
  keepInMemoryCache: boolean
}

/**
 * Function that packherd calls in order to initialize the {@link TranspileCache}.
 *
 * @category Transpilation
 */
export type InitTranspileCache = (
  projectBasedir: string,
  opts?: Partial<TranspileCacheOpts>
) => TranspileCache | undefined

/**
 * Transpile options
 *
 * @property tsconfig: passed to esbuild
 * @property supportTS: when `true` Typescript will be transpiled, otherwise not
 * @property initTranspileCache: called by packherd to init transpile cache
 *
 * @category Transpilation
 */
export type PackherdTranspileOpts = {
  tsconfig?: TransformOptions['tsconfigRaw']
  supportTS?: boolean
  initTranspileCache?: InitTranspileCache
}

// -----------------
// SourcemapSupport
// -----------------
/**
 * @private
 * @category Sourcemap
 */
export type UrlAndMap = { url: string | null, map: SourceMapConsumer | null }

/**
 * @category Sourcemap
 */
export type MapAndSourceContent = {
  url: string
  map: SourceMapConsumer
  sourceContent: string
}
