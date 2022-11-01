import type { CreateBundleResult } from '@tooling/packherd'
import type { RawSourceMap } from 'source-map-js'

type NodeRequireFunction = typeof require

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

/**
 * esbuild metadata {@link https://esbuild.github.io/api/#metafile} with extra
 * properties that is included by the snapshot esbuild
 *
 * Namely it includes a `resolverMap` property which is embedded into the
 * snapshot in order to resolve modules without having to query the file system
 *
 * @category snapshot
 */
export type Metadata = CreateBundleResult['metafile'] & {
  inputs: Record<
    string,
    {
      bytes: number
      fileInfo: {
        fullPath: string
      }
      imports: {
        path: string
        kind: 'require-call'
      }[]
    }
  >
  resolverMap: Record<string, string>
}

/**
 * Configures how the bundle to be snapshotted is generated.
 *
 * @property baseDirPath root of the project which we are snapshotting
 *
 * @property entryFilePath file we use as the entry-point and from which all
 * modules to be snapshotted are reachable
 *
 * @property bundlerPath the esbuild bundler binary to use, if not provided it
 * falls back to the installed one
 *
 * @property nodeModulesOnly if `true` only node_modules are included in the
 * snapshot, i.e. application files are not
 *
 * @property deferred you should provide any modules here that you know need
 * to be deferred in order to speed up the doctor step
 *
 * @property norewrite you should provide any modules here that you know
 * should not be rewritten in order to speed up the doctor step and to work
 * around issues due to invalid rewrites
 *
 * @property includeStrictVerifiers if `true` the bundle will be more strictly
 * checked when validated inside the Node.js VM
 * This should be set when running the doctor and unset when building the
 * bundle to be snapshotted
 *
 * @property sourcemap if `true` then a sourcemap will be generated for the
 * bundled files
 *
 * @property sourcemapExternalPath the file to write the generated sourcemap
 * to if that is desired
 *
 * @property sourcemapEmbed when `true` the sourcemap is embedded in the
 * snapshot
 *
 * @property sourcemapInline when `true` the sourcemap is inlined at the
 * bottom of the bundled file that is snapshotted
 *
 * @category snapshot
 */
export type CreateBundleOpts = {
  baseDirPath: string
  entryFilePath: string
  bundlerPath: string
  nodeModulesOnly: boolean
  deferred?: string[]
  norewrite?: string[]
  includeStrictVerifiers?: boolean
  sourcemap?: boolean
  sourcemapExternalPath?: string
  sourcemapEmbed: boolean
  sourcemapInline: boolean
}

/**
 * Adds Snapshot specific opts to the {@link CreateBundleOpts}.
 *
 * @property resolverMap the map that should be embedded in the snapshot in
 * order to resolve module import requests without querying the file system
 *
 * @property auxiliaryData any extra data that should be embedded in the
 * snapshot
 *
 * @property nodeEnv `process.env.NODE_ENV` will be set to this value during
 * snapshot creation, see src/blueprint.ts:88
 *
 * @category snapshot
 */
export type CreateSnapshotScriptOpts = CreateBundleOpts & {
  resolverMap?: Record<string, string>
  auxiliaryData?: Record<string, any>
  nodeEnv: string
}

/**
 * Used to configure the workers that are processing a snapshot script in parallel
 * @category snapshot
 */
export type ProcessScriptOpts = {
  bundleHash: string
  bundlePath: string

  baseDirPath: string
  entryFilePath: string
  entryPoint: string

  nodeEnv: string
}

/**
 * Possible outcomes of processing a snapshot script.
 *
 * - 'failed:assembleScript' means that the bundler generated a proper bundle
 * but it couldn't be included in the snapshot script
 * - 'failed:verifyScript' means that the script was assembled fine, but some
 * violation was detected during the verification phase which indicates that it
 * couldn't be snapshotted as is
 * - 'completed' all went fine the script could be snapshotted as is
 *
 * @category snapshot
 */
export type ProcessScriptResult = {
  outcome: 'failed:assembleScript' | 'failed:verifyScript' | 'completed'
  error?: Error
}

/** Specifies the signature of the function that represents a module definition
 * and when invoked returns a Node.js `module`.
 *
 * Note that an `exports` parameter which is the same instance as the
 * `module.exports` field.  The module either mutates the `exports` directly or
 * reassigns `module.exports`.  After invoking it, the `module.exports` are
 * considered the exports of the module.
 *
 * These definitions are embedded into the snapshot and invoked at runtime.
 * They are used instead of full-fledged exports when snapshotting would fail
 * were we to initialize them during the snapshot phase.
 *
 * @category snapshot
 * @category loader
 */
export type ModuleDefinition = (
  exports: NodeModule['exports'],
  module: {
    exports: NodeModule['exports']
  },
  __filename: string,
  __dirname: string,
  require: NodeRequireFunction
) => NodeModule

/**
 * The result of snapshotting a snapshot script. Namely it has the
 * `customRequire` function which also references the `exports` containing fully
 * initialized modules as well as `definitions` {@link ModuleDefinition}..
 *
 * @category snapshot
 */
export type Snapshot = {
  customRequire: {
    definitions: Record<string, NodeRequireFunction>
    exports: Record<string, NodeModule>
    // Module._cache === require.cache
    cache: Record<string, NodeModule>
  }
}

/**
 * Extra data we include in the snapshot, namely the embedded `sourceMap`.
 * @category snapshot
 */
export type SnapshotAuxiliaryData = {
  sourceMap?: RawSourceMap
}

/**
 * Represents dependencies of a module.
 *
 * @property directDeps are all dependencies which are directly imported by the module
 * @property allDeps are all dependencies imported by the module as well as by
 * its dependencies transitively
 */
export type DependencyNode = { directDeps: Set<string>, allDeps: Set<string> }

/**
 * The array representation of the dependency map which is used to embed it
 * into the snapshot.
 */
export type DependencyMapArray = Array<
  [string, { directDeps: string[], allDeps: string[] }]
>
