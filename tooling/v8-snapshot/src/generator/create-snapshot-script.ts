import debug from 'debug'
import { strict as assert } from 'assert'
import { readFileSync } from 'fs'
import path from 'path'
import { execSync, ExecSyncOptions, StdioOptions } from 'child_process'
import { BlueprintConfig, scriptFromBlueprint } from './blueprint'
import type { CreateBundleOpts, CreateSnapshotScriptOpts, Metadata } from '../types'
import {
  CreateBundle,
  packherd,
  CreateBundleOpts as PackherdCreateBundleOpts,
  CreateBundleResult,
  CreateBundleSourcemap,
} from '@tooling/packherd'
import { dependencyMapArrayFromInputs } from '../meta/dependency-map'
import { writeConfigJSON } from './write-config-json'
import { tryRemoveFileSync } from '../utils'

const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')
const logTrace = debug('cypress:snapgen:trace')
const logError = debug('cypress:snapgen:error')

const keepConfig = process.env.SNAPSHOT_KEEP_CONFIG != null

/**
 * The comment injected to denote the start of the bundle content included with
 * the snapshot script.
 * @category snapshot
 */
export const BUNDLE_WRAPPER_OPEN = Buffer.from(
  `
  //
  // <esbuild bundle>
  //
`,
  'utf8',
)

/**
 * The comment injected to denote the end of the bundle content included with
 * the snapshot script.
 * Additionally it assigns `customRequire.definitions` to the bundle module
 * hash.
 * @category snapshot
 */
export const BUNDLE_WRAPPER_CLOSE = Buffer.from(
  `
  //
  // </esbuild bundle>
  //

  customRequire.definitions = __commonJS 
`,
  'utf8',
)

/**
 * The function type to create a snapshot script which receives the {@link
 * CreateSnapshotScriptOpts} as configuration.
 * @category snapshot
 */
export type CreateSnapshotScript = (
  opts: CreateSnapshotScriptOpts
) => Promise<{ snapshotScript: string }>

const requireDefinitions = (bundle: Buffer, entryPoint: string) => {
  const code = Buffer.concat([
    BUNDLE_WRAPPER_OPEN,
    bundle,
    BUNDLE_WRAPPER_CLOSE,
  ])

  return {
    code,
    mainModuleRequirePath: entryPoint,
  }
}

function getMainModuleRequirePath (basedir: string, entryFullPath: string) {
  logDebug('Obtaining main module require path given', {
    basedir,
    entryFullPath,
  })

  const relPath = path.relative(basedir, entryFullPath)

  return `./${relPath}`
}

/**
 * Assembles a snapshot script for the provided bundle configured for the
 * provided meta data, basedir and opts.
 *
 * @param bundle contents of the bundle created previously
 * @param basedir project root directory
 * @param entryFilepath the path to the file to use as the entry to the app
 * direct/indirect dependents are either included directly or a discoverable by
 * following the imports present
 * @param opts configure how the script is generated and assembled and are
 * mainly a subset of {@link GenerationOpts}
 *
 * @return the contents of the assembled script as well as the source map
 * preprocessed
 *
 * @category snapshot
 */
export function assembleScript (
  bundle: Buffer,
  basedir: string,
  entryFilePath: string,
  opts: {
    auxiliaryData?: Record<string, any>
    entryPoint?: string
    includeStrictVerifiers?: boolean
    sourceMap?: Buffer
    baseSourcemapExternalPath: string | undefined
    processedSourcemapExternalPath: string | undefined
    nodeEnv: string
    cypressInternalEnv: string
    resolverMap?: Record<string, string>
    meta?: Metadata
    supportTypeScript: boolean
    integrityCheckSource: string | undefined
  },
): { script: Buffer, processedSourceMap?: string } {
  const includeStrictVerifiers = opts.includeStrictVerifiers ?? false
  const auxiliaryData = Object.assign({}, opts.auxiliaryData)

  // Prefer the provided resolver map over the one found in the current meta data.
  // This allows us to use the app entry file when generating this map and another
  // snapshotting specific entry, possibly generated, to create the snapshot.
  const resolverMap = opts.resolverMap ?? opts.meta?.resolverMap

  if (resolverMap != null) {
    if (logDebug.enabled) {
      logDebug(
        'Embedding resolver map with %d entries into snapshot',
        Object.keys(resolverMap).length,
      )
    }

    auxiliaryData.resolverMap = resolverMap
  }

  // 1. Prepare the resolver map to be included in the snapshot and embed it via auxiliaryData
  if (opts.meta?.inputs != null) {
    const mapArray = dependencyMapArrayFromInputs(opts.meta.inputs)

    logDebug('Embedding dependency map into snapshot')
    auxiliaryData.dependencyMapArray = mapArray
  }

  const auxiliaryDataString = JSON.stringify(auxiliaryData)

  // 2. Determine the path of the main module which needs to be required in
  //    order to trigger initialization of the modules we want to embed during
  //    snapshot creation
  const mainModuleRequirePath =
    opts.entryPoint ?? getMainModuleRequirePath(basedir, entryFilePath)

  assert(
    mainModuleRequirePath != null,
    'metadata should have exactly one entry point',
  )

  // 3. Prepare the bundled definitions for inclusion in the snapshot script
  const defs = requireDefinitions(bundle, mainModuleRequirePath)

  // 4. Prepare the config which we'll use to generate the snapshot script from
  //    the ./blueprint templates
  const config: BlueprintConfig = {
    processPlatform: process.platform,
    processNodeVersion: process.version,
    mainModuleRequirePath: JSON.stringify(defs.mainModuleRequirePath),
    auxiliaryData: auxiliaryDataString,
    customRequireDefinitions: defs.code,
    includeStrictVerifiers,
    sourceMap: opts.sourceMap,
    nodeEnv: opts.nodeEnv,
    cypressInternalEnv: opts.cypressInternalEnv,
    basedir,
    processedSourceMapPath: opts.processedSourcemapExternalPath,
    supportTypeScript: opts.supportTypeScript,
    integrityCheckSource: opts.integrityCheckSource,
  }

  // 5. Finally return the rendered script buffer and optionally processed
  //    sourcemaps
  return scriptFromBlueprint(config)
}

/**
 * Creates bundle and meta file via the provided bundler written in Go
 * and reads and returns its contents asynchronously.
 *
 * @param opts
 * @return promise of the paths and contents of the created bundle and related metadata
 * @category snapshot
 */
export async function createBundleAsync (opts: CreateBundleOpts): Promise<{
  warnings: CreateBundleResult['warnings']
  meta: Metadata
  bundle: Buffer
  sourceMap?: Buffer
}> {
  return createBundle(opts)
}

export type SnapshotScript = { snapshotScript: Buffer, meta: Metadata, bundle: Buffer }

/**
 * Creates a bundle for the provided entry file and then assembles a
 * snapshot script from them.
 *
 * @param opts
 * @return the paths and contents of the created bundle and related metadata
 * as well as the created snapshot script
 * @category snapshot
 */
export async function createSnapshotScript (
  opts: CreateSnapshotScriptOpts,
): Promise<SnapshotScript> {
  const { bundle, sourceMap, meta } = await createBundleAsync(opts)

  logDebug('Assembling snapshot script')
  const { script } = assembleScript(
    bundle,
    opts.baseDirPath,
    opts.entryFilePath,
    {
      auxiliaryData: opts.auxiliaryData,
      includeStrictVerifiers: opts.includeStrictVerifiers,
      sourceMap,
      baseSourcemapExternalPath: opts.baseSourcemapExternalPath,
      processedSourcemapExternalPath: opts.processedSourcemapExternalPath,
      nodeEnv: opts.nodeEnv,
      cypressInternalEnv: opts.cypressInternalEnv,
      resolverMap: opts.resolverMap,
      meta,
      supportTypeScript: opts.supportTypeScript,
      integrityCheckSource: opts.integrityCheckSource,
    },
  )

  return { snapshotScript: script, meta: meta as Metadata, bundle }
}

function stringToBuffer (contents: string) {
  return Buffer.from(contents, 'hex')
}

/**
 * This creates the {@link CreateBundle} function that we provide to packherd.
 *
 * It combines the provided {@link CreateBundleOpts} and {@link
 * PackherdCreateBundleOpts} in order to configure how that step is performed.
 * @category snapshot
 */
const makePackherdCreateBundle: (opts: CreateBundleOpts) => CreateBundle =
  (opts: CreateBundleOpts) => {
    return (popts: PackherdCreateBundleOpts) => {
      const basedir = path.resolve(process.cwd(), opts.baseDirPath)
      // 1. Write the config to a file so that the bundler can pick it up
      const { configPath, config } = writeConfigJSON(
        opts,
        popts.entryFilePath,
        basedir,
        opts.baseSourcemapExternalPath,
      )

      // 2. Launch bundler providing it the path to the config file
      const cmd = `${opts.bundlerPath} ${configPath}`

      logDebug('Running "%s"', cmd)
      logTrace(config)

      // the returned bundle content could be very large, we're making sure we don't exceed the buffer size
      const _MB = 1024 * 1024
      const execOpts: ExecSyncOptions = Object.assign(
        {
          maxBuffer: 8000 * _MB,
          cwd: basedir,
          env: {
            NODE_OPTIONS: '--max-old-space-size=16384',
          },
        },
        // Windows doesn't properly support piping stdio
        process.platform === 'win32'
          ? {}
          : { stdio: ['pipe', 'pipe', 'pipe'] as StdioOptions },
      )

      try {
        // 3. Receive the JSON encoded result via stdout and parse it
        const stdout = execSync(cmd, execOpts)
        const { warnings, outfiles, metafile } = JSON.parse(stdout.toString())

        // 4. verify we got what we expected
        assert(outfiles.length >= 1, 'need at least one outfile')
        assert(metafile != null, 'expected metafile to be included in result')
        assert(
          metafile.contents != null,
          'expected metafile to include contents buffer',
        )

        const bundleContents = outfiles[0].contents
        const bundle = { contents: stringToBuffer(bundleContents) }

        // Sourcemaps are optional
        const includedSourcemaps = outfiles.length === 2

        if (opts.sourcemap) {
          assert(
            includedSourcemaps,
            'should include sourcemap when sourcemap is configured',
          )
        } else {
          assert(
            !includedSourcemaps,
            'should only include sourcemap when sourcemap is configured',
          )
        }

        assert(
          opts.sourcemap !== true || opts.baseSourcemapExternalPath != null,
          'should include sourcemapExternalPath when sourcemap option is set',
        )

        if (opts.sourcemap) {
          logInfo(
            'External sourcemaps written to "%s"',
            opts.baseSourcemapExternalPath,
          )
        }

        // 5. Optionally write the sourcemap to a file
        let sourceMap: CreateBundleSourcemap | undefined = undefined

        if (opts.baseSourcemapExternalPath != null) {
          try {
            sourceMap = {
              contents: readFileSync(opts.baseSourcemapExternalPath),
            }
          } catch (err: any) {
            logError(
              'Failed to read sourcemap from "%s"',
              opts.baseSourcemapExternalPath,
            )
          }
        }

        // 6. Parse out metadata created as part of the bundling process
        const metadata: Metadata = JSON.parse(
          stringToBuffer(metafile.contents).toString(),
        )
        // 7. Piece together the result and return it
        const result: CreateBundleResult = {
          warnings,
          outputFiles: [bundle],
          sourceMap,
          metafile: metadata,
        }

        return Promise.resolve(result)
      } catch (err: any) {
        if (err.stderr != null) {
          logError(err.stderr.toString())
        }

        if (err.stdout != null) {
          logDebug(err.stdout.toString())
        }

        logError(err)

        return Promise.reject(new Error(`Failed command: "${cmd}"`))
      } finally {
        if (!keepConfig) {
          const err = tryRemoveFileSync(configPath)

          // We log the error here, but don't fail since the config file might not have been created and thus removing it
          // fails. Also removing this temp file is not essential to snapshot creation.
          if (err != null) {
            logError(err)
          }
        } else {
          logInfo('Kept config at %s', configPath)
        }
      }
    }
  }

/**
 * Creates a bundle via {@link https://github.com/thlorenz/packherd}
 * Note that we override the `createBundle` function in order to use our custom
 * bundler and handle extracting the results from JSON passed via `stdout`.
 *
 * @param opts configure how the bundle is generated {@link CreateBundleOpts}
 * @category snapshot
 */
async function createBundle (opts: CreateBundleOpts) {
  const { warnings, bundle, sourceMap, meta } = await packherd({
    entryFile: opts.entryFilePath,
    nodeModulesOnly: opts.nodeModulesOnly,
    createBundle: makePackherdCreateBundle(opts),
  })

  return { warnings, bundle, sourceMap, meta: meta as Metadata }
}
