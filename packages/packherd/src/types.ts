import type {
  BuildOptions,
  BuildResult,
  Metafile,
  OutputFile,
  TransformOptions,
} from 'esbuild'

import type { RawSourceMap, SourceMapConsumer } from 'source-map-js'

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
 *  - 'cach:node': resolved from cache after determining full path via Node.js
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
// Bundle Creation
// -----------------
/**
 * Extension of [esbuild BuildOptions](https://esbuild.github.io/api/#simple-options).
 *
 * @category Bundle
 */
export type CreateBundleOpts = BuildOptions & {
  entryFilePath: string
}

/** @category Bundle */
export type CreateBundleOutputFile = {
  contents: OutputFile['contents']
}

/** @category Bundle */
export type CreateBundleSourcemap = {
  contents: OutputFile['contents']
}

/**
 * Result of creating a bundle.
 *
 * @property warnings: emitted by esbuild
 * @property outputFiles: generally the emitted bundle
 * @property sourceMap: included when packherd was configured to generate it
 * @property metafile: [esbuild Metafile](https://esbuild.github.io/api/#metafile)
 *
 * @category Bundle
 */
export type CreateBundleResult = {
  warnings: BuildResult['warnings']
  outputFiles: CreateBundleOutputFile[]
  sourceMap?: CreateBundleSourcemap
  metafile?: Metafile
}

/**
 * Type of Function that needs to be provided in order to override the default `createBundle`.
 *
 * @category Bundle
 */
export type CreateBundle = (
  args: CreateBundleOpts
) => Promise<CreateBundleResult>

// -----------------
// Transpilation
// -----------------
/**
 * Interface to the cache used to store/retrieve transpiled TypeScript
 *
 * @category Transpilation */
export interface TranspileCache {
  get(fullPath: string, skipStaleCheck?: boolean): string | undefined
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
export type SourceMapLookup = (uri: string) => RawSourceMap | undefined

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
