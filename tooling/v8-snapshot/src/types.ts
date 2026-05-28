import type { CreateBundleResult } from '@tooling/packherd'

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
 * @property baseSourcemapExternalPath the file to write the raw generated sourcemap
 * to if that is desired
 *
 * @property processedSourcemapExternalPath the file to write the processed generated sourcemap
 * to if that is desired
 *
 * @property supportTypeScript if `true` then TypeScript is supported when using
 * snapshot require
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
  baseSourcemapExternalPath?: string
  processedSourcemapExternalPath?: string
  supportTypeScript: boolean
  integrityCheckSource: string | undefined
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
 * snapshot creation, see src/blueprint.ts
 *
 * @property cypressInternalEnv `process.env.CYPRESS_INTERNAL_ENV` will be set to this value during
 * snapshot creation, see src/blueprint.ts
 *
 * @category snapshot
 */
export type CreateSnapshotScriptOpts = CreateBundleOpts & {
  resolverMap?: Record<string, string>
  auxiliaryData?: Record<string, any>
  nodeEnv: string
  cypressInternalEnv: string
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
  cypressInternalEnv: string

  supportTypeScript: boolean

  integrityCheckSource: string | undefined
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
