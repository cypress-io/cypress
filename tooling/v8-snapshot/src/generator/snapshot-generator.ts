import { strict as assert } from 'assert'
import debug from 'debug'
import fs from 'fs'
import { dirname, join, basename } from 'path'
import { minify } from 'terser'
import { createSnapshotScript, SnapshotScript } from './create-snapshot-script'
import { SnapshotVerifier } from './snapshot-verifier'
import { determineDeferred } from '../doctor/determine-deferred'
import {
  backupName,
  checkDirSync,
  installedElectronResourcesFilePath,
  ensureDirSync,
  fileExistsSync,
  getBundlerPath,
  resolveElectronVersion,
} from '../utils'
import { createExportScript, ExportScript } from './create-snapshot-bundle'
import { Flag, GeneratorFlags } from './snapshot-generator-flags'
import { syncAndRun } from '@tooling/electron-mksnapshot'
import tempDir from 'temp-dir'

const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')
const logError = debug('cypress:snapgen:error')

/**
 * Configure snapshot creation.
 *
 * @property cacheDir the path to store the snapshot script and all snapshot generation related meta data in
 *
 * @property nodeModulesOnly if `true` only node modules will be included in the snapshot and app modules are omitted
 *
 * @property forceNoRewrite relative paths to modules that we know will cause
 * problems when rewritten and we manually want to exclude them from snapshot
 * bundler rewrites
 *
 * @property resolverMap the map which will be embedded into the snapshot in
 * order to resolve modules without relying on the Node.js module resolution
 * mechanism which requires I/O.
 *
 * This map is determined via metadata that the bundler emits during bundle
 * generation.  The keys are the directory relative to the project base dir,
 * from which a module was resolved concatenated with the import request
 * string (separated by `'***'`, see ./loading/snapshot-require
 * RESOLVER_MAP_KEY_SEP) and the value the fully resolved path relative to the
 * project base dir.
 *
 * #### Example
 *
 *```text
 * Given this statement inside:
 *
 *  /dev/project/base/pack-uno/lib/foo.js: `const bar = require('../bar')`
 *
 * which resolved to
 *
 *  /dev/project/base/pack-uno/bar/index.js
 *
 * The following is stored inside the map:
 *
 * `{ './pack-uno/lib***../bar': './pack-uno/bar/index.js' }`
 * ```
 *   `
 *
 * @property flags snapshot script creation flags
 *
 * @property nodeEnv the string to provide to `process.env.NODE_ENV` during
 * snapshot creation
 *
 * @property cypressInternalEnv the string to provide to `process.env.CYPRESS_INTERNAL_ENV` during
 * snapshot creation
 *
 * @property minify if `true` the snapshot script will be minified
 *
 * @property supportTypeScript if `true` then TypeScript should be supported
 * when using snapshot require
 *
 * @category snapshot
 */
export type GenerationOpts = {
  cacheDir: string
  snapshotBinDir: string
  nodeModulesOnly: boolean
  forceNoRewrite?: string[]
  resolverMap?: Record<string, string>
  flags: Flag
  nodeEnv: string
  cypressInternalEnv: string
  minify: boolean
  supportTypeScript: boolean
  integrityCheckSource: string | undefined
  useExistingSnapshotScript?: boolean
  updateSnapshotScriptContents?: (contents: string) => string
}

function getDefaultGenerationOpts (projectBaseDir: string): GenerationOpts {
  return {
    cacheDir: join(projectBaseDir, 'cache'),
    snapshotBinDir: projectBaseDir,
    nodeModulesOnly: true,
    flags: Flag.Script | Flag.MakeSnapshot | Flag.ReuseDoctorArtifacts,
    nodeEnv: 'development',
    cypressInternalEnv: 'development',
    minify: false,
    supportTypeScript: false,
    integrityCheckSource: undefined,
    useExistingSnapshotScript: false,
    updateSnapshotScriptContents: undefined,
  }
}

/**
 * The snapshot generator provides the top level API to create a snapshot
 * script and then convert that into a snapshot binary and finally install it
 * to the correct location.
 *
 * NOTE: that most fields are directly derived from {@link GenerationOpts} and
 * you should refer to the documentation there for more info.
 *
 * @category snapshot
 */
export class SnapshotGenerator {
  /** See {@link GenerationOpts} cacheDir */
  private readonly cacheDir: string
  /** See {@link GenerationOpts} snapshotScriptPath */
  private readonly snapshotScriptPath: string
  /** Path to store snapshot script inside {@link GenerationOpts} cacheDir */
  private readonly snapshotExportScriptPath: string
  /** See {@link GenerationOpts} snapshotBinDir */
  private readonly snapshotBinDir: string
  /** See {@link GenerationOpts} ?: */
  private readonly resolverMap?: Record<string, string>
  /** See {@link GenerationOpts} ?: */
  private readonly auxiliaryData?: Record<string, any>
  /** See {@link GenerationOpts} electronVersion */
  private readonly electronVersion: string
  /** See {@link GenerationOpts} nodeModulesOnly */
  private readonly nodeModulesOnly: boolean
  /** See {@link GenerationOpts} forceNoRewrite */
  private readonly forceNoRewrite: Set<string>
  /** See {@link GenerationOpts} nodeEnv */
  private readonly nodeEnv: string
  /** See {@link GenerationOpts} cypressInternalEnv */
  private readonly cypressInternalEnv: string
  /** See {@link GenerationOpts} minify */
  private readonly minify: boolean
  /** See {@link GenerationOpts} integrityCheckSource */
  private readonly integrityCheckSource: string | undefined
  /**
   * Path to the Go bundler binary used to generate the bundle with rewritten code
   * {@link https://github.com/cypress-io/esbuild/tree/thlorenz/snap}
   */
  private readonly bundlerPath: string
  private readonly _snapshotVerifier: SnapshotVerifier
  /** See {@link GenerationOpts} flags */
  private readonly _flags: GeneratorFlags

  /**
   * Path where snapshot bin is stored, derived from {@link GenerationOpts} snapshotBinDir
   */
  private snapshotBinPath?: string
  /**
   * Path where v8context bin is stored, derived from {@link GenerationOpts} snapshotBinDir
   */
  private v8ContextFile?: string
  /**
   * Whether to use an existing snapshot script instead of creating a new one.
   */
  useExistingSnapshotScript?: boolean
  /**
   * Function to update the contents of an existing snapshot script.
   */
  updateSnapshotScriptContents?: ((contents: string) => string)

  /**
   * Generated snapshot script, needs to be set before calling `makeSnapshot`.
   */
  snapshotScript?: Buffer
  /**
   * Generated snapshot export script, see {@link GeneratorFlags}.
   */
  snapshotExportScript?: string

  /**
   * Creates a new instance of the {@link SnapshotGenerator}.
   *
   * @param projectBaseDir the root of the app for which we create the snapshot
   * @param snapshotEntryFile the file to use as the entry for our app, best is
   * to use one generated via `./snapshot-generate-entry-via-deps`.
   * @param opts further configuration {@link GenerationOpts}
   *
   * @category snapshot
   */
  constructor (
    readonly projectBaseDir: string,
    readonly snapshotEntryFile: string,
    opts: Partial<GenerationOpts> = {},
  ) {
    const {
      cacheDir,
      nodeModulesOnly,
      forceNoRewrite,
      flags: mode,
      nodeEnv,
      cypressInternalEnv,
      minify,
      integrityCheckSource,
      useExistingSnapshotScript,
      updateSnapshotScriptContents,
    }: GenerationOpts = Object.assign(
      getDefaultGenerationOpts(projectBaseDir),
      opts,
    )

    this.cacheDir = cacheDir
    ensureDirSync(this.cacheDir)

    this.snapshotBinDir = join(tempDir, 'cy-v8-snapshot-bin')
    ensureDirSync(this.snapshotBinDir)

    this._snapshotVerifier = new SnapshotVerifier()
    this.snapshotScriptPath = join(cacheDir, 'snapshot.js')
    this.snapshotExportScriptPath = join(cacheDir, 'snapshot-bundle.js')
    this.resolverMap = opts.resolverMap
    this.electronVersion = resolveElectronVersion(projectBaseDir)

    this.nodeModulesOnly = nodeModulesOnly
    this.forceNoRewrite = new Set(forceNoRewrite)
    this.nodeEnv = nodeEnv
    this.cypressInternalEnv = cypressInternalEnv
    this._flags = new GeneratorFlags(mode)
    this.bundlerPath = getBundlerPath()
    this.minify = minify
    this.integrityCheckSource = integrityCheckSource
    this.useExistingSnapshotScript = useExistingSnapshotScript
    this.updateSnapshotScriptContents = updateSnapshotScriptContents

    const auxiliaryDataKeys = Object.keys(this.auxiliaryData || {})

    logInfo({
      projectBaseDir,
      cacheDir,
      snapshotScriptPath: this.snapshotScriptPath,
      nodeModulesOnly: this.nodeModulesOnly,
      forceNoRewrite: this.forceNoRewrite.size,
      auxiliaryData: auxiliaryDataKeys,
    })
  }

  private _addGitignore () {
    const gitignore = 'snapshot.js\nbase.snapshot.js.map\nprocessed.snapshot.js.map\nesbuild-meta.json\nsnapshot-entry.js\n'

    const gitignorePath = join(this.cacheDir, '.gitignore')

    return fs.promises.writeFile(gitignorePath, gitignore)
  }

  /**
   * Creates the snapshot script for the provided configuration
   */
  async createScript () {
    if (this.useExistingSnapshotScript) {
      let contents = await fs.promises.readFile(this.snapshotScriptPath, 'utf8')

      if (this.updateSnapshotScriptContents) {
        contents = this.updateSnapshotScriptContents(contents)
      }

      this.snapshotScript = Buffer.from(contents)
      await fs.promises.writeFile(this.snapshotScriptPath, this.snapshotScript)

      return
    }

    let deferred
    let norewrite

    try {
      // 1. Try to obtain a starting point so we don't always start from scratch
      //    If we're bundling for the first time and no then this will
      //    return empty arrays
      ({ deferred, norewrite } = await determineDeferred(
        this.bundlerPath,
        this.projectBaseDir,
        this.snapshotEntryFile,
        this.cacheDir,
        {
          nodeModulesOnly: this.nodeModulesOnly,
          forceNoRewrite: this.forceNoRewrite,
          nodeEnv: this.nodeEnv,
          cypressInternalEnv: this.cypressInternalEnv,
          integrityCheckSource: this.integrityCheckSource,
        },
      ))
    } catch (err) {
      logError('Failed obtaining deferred modules to create script')
      throw err
    }

    let result: SnapshotScript

    try {
      // 2. Create the initial snapshot script using whatever info we
      // collected in step 1 as well as the provided configuration
      result = await createSnapshotScript({
        baseDirPath: this.projectBaseDir,
        entryFilePath: this.snapshotEntryFile,
        bundlerPath: this.bundlerPath,
        includeStrictVerifiers: false,
        deferred,
        norewrite,
        resolverMap: this.resolverMap,
        auxiliaryData: this.auxiliaryData,
        nodeModulesOnly: this.nodeModulesOnly,
        sourcemap: true,
        baseSourcemapExternalPath: this.snapshotScriptPath.replace('snapshot.js', 'base.snapshot.js.map'),
        processedSourcemapExternalPath: this.snapshotScriptPath.replace('snapshot.js', 'processed.snapshot.js.map'),
        nodeEnv: this.nodeEnv,
        cypressInternalEnv: this.cypressInternalEnv,
        supportTypeScript: this.nodeModulesOnly,
        integrityCheckSource: this.integrityCheckSource,
      })
    } catch (err) {
      logError('Failed creating script')
      throw err
    }
    logDebug(
      Object.assign({}, result, {
        snapshotScript: `len: ${result.snapshotScript.length}`,
        bundle: `len: ${result.bundle.length}`,
        meta: '<hidden>',
      }),
    )

    this.snapshotScript = result.snapshotScript

    // 3. Since we don't want the `mksnapshot` command to bomb with cryptic
    //    errors we verify that the generated script is snapshot-able.
    logInfo('Verifying snapshot script')
    try {
      this._verifyScript()
    } catch (err) {
      logInfo(`Script failed verification, writing to ${this.snapshotScriptPath}`)

      await fs.promises.writeFile(
        this.snapshotScriptPath,
        this.snapshotScript,
      )

      throw err
    }

    await this._addGitignore()

    logInfo(`Writing snapshot script to ${this.snapshotScriptPath}`)

    if (this.minify) {
      const minified = await minify(this.snapshotScript!.toString(), {
        sourceMap: false,
      })

      if (!minified.code) {
        await fs.promises.writeFile(this.snapshotScriptPath, this.snapshotScript)
        throw new Error(`Failed to minify snapshot script. Writing unminified code to ${this.snapshotScriptPath}`)
      }

      return fs.promises.writeFile(this.snapshotScriptPath, minified.code)
    }

    // 4. Write the snapshot script to the configured file
    return fs.promises.writeFile(this.snapshotScriptPath, this.snapshotScript)
  }

  /**
   * Creates an export bundle.
   * This is almost identical to `createScript` except that it will export
   * all definitions.
   * This is mostly useful for tests.
   *
   */
  async createExportBundle () {
    // As the steps are almost identical to `createScript` no extra code
    // comments were added.
    let deferred
    let norewrite

    try {
      ({ deferred, norewrite } = await determineDeferred(
        this.bundlerPath,
        this.projectBaseDir,
        this.snapshotEntryFile,
        this.cacheDir,
        {
          nodeModulesOnly: this.nodeModulesOnly,
          forceNoRewrite: this.forceNoRewrite,
          nodeEnv: this.nodeEnv,
          cypressInternalEnv: this.cypressInternalEnv,
          integrityCheckSource: this.integrityCheckSource,
        },
      ))
    } catch (err) {
      logError('Failed obtaining deferred modules to create script')
      throw err
    }

    logInfo('determined deferred %o', { deferred, norewrite })

    let result: ExportScript

    try {
      result = await createExportScript({
        baseDirPath: this.projectBaseDir,
        entryFilePath: this.snapshotEntryFile,
        bundlerPath: this.bundlerPath,
        includeStrictVerifiers: false,
        deferred,
        norewrite,
        nodeModulesOnly: this.nodeModulesOnly,
        sourcemap: false,
        resolverMap: this.resolverMap,
        auxiliaryData: this.auxiliaryData,
        nodeEnv: this.nodeEnv,
        cypressInternalEnv: this.cypressInternalEnv,
        supportTypeScript: this.nodeModulesOnly,
        integrityCheckSource: this.integrityCheckSource,
      })
    } catch (err) {
      logError('Failed creating script')
      throw err
    }
    logDebug(
      Object.assign({}, result, {
        snapshotBundle: `len: ${result.snapshotBundle.length}`,
        bundle: `len: ${result.bundle.length}`,
        meta: '<hidden>',
      }),
    )

    this.snapshotExportScript = result.snapshotBundle

    logInfo(`Writing export bundle script to ${this.snapshotExportScriptPath}`)

    return fs.promises.writeFile(
      this.snapshotExportScriptPath,
      this.snapshotExportScript,
    )
  }

  /**
   * This will call the `mksnapshot` command feeding it the snapshot script
   * previously created via `createScript` which needs to be invoked before
   * running this function.
   *
   * The resulting snapshot binary is written to `this.snapshotBinPath` and
   * needs to be moved to the correct location by calling `installSnapshot`.
   */
  async makeSnapshot () {
    function runInstructions () {
      const bin = require.resolve('@tooling/electron-mksnapshot/dist/mksnapshot-bin')
      const cmd = `node ${bin} ${args.join(' ')}`

      logError(`Run:\n   ${cmd}\n to investigate.`)
    }
    // 1. Check that everything is prepared to create the snapshot
    assert(
      this.snapshotScript != null,
      'Run `createScript` first to create snapshotScript',
    )

    assert(
      this._flags.has(Flag.MakeSnapshot),
      'Cannot makeSnapshot when MakeSnapshot flag is not set',
    )

    // 2. Run the `mksnapshot` binary providing it the path to our snapshot
    //    script
    // --no-use-ic flag is a workaround
    // see https://issues.chromium.org/issues/345280736#comment12
    const args = [this.snapshotScriptPath, '--output_dir', this.snapshotBinDir, '--no-use-ic']

    try {
      const { snapshotBlobFile, v8ContextFile } = await syncAndRun(
        this.electronVersion,
        args,
      ) as { snapshotBlobFile: string, v8ContextFile: string }

      this.v8ContextFile = v8ContextFile
      this.snapshotBinPath = join(this.snapshotBinDir, snapshotBlobFile)

      // 3. Verify that all worked out and the snapshot binary is where we
      //    expect it
      if (!fileExistsSync(this.snapshotBinPath)) {
        logError(
          `Cannot find ${this.snapshotBinPath} which should've been created.\n` +
            `This could be due to the mksnapshot command silently failing.`,
        )

        runInstructions()

        throw new Error('Failed `mksnapshot` command')
      }

      return { v8ContextFile: this.v8ContextFile, snapshotBinDir: this.snapshotBinDir }
    } catch (err: any) {
      if (err.stderr != null) {
        logError(err.stderr.toString())
      }

      if (err.stdout != null) {
        logDebug(err.stdout.toString())
      }

      // If things went wrong print instructions on how to execute the
      // `mksnapshot` command directly to trouble shoot
      runInstructions()
      throw new Error('Failed `mksnapshot` command')
    }
  }

  /**
   * Calling this function will first back up the existing electron snapshot
   * unless it was previously backed up. This allows to always revert back
   * to a version of the app without any modified snapshot binary, see
   * `uninstallSnapshot`.
   *
   * Then it will move the snapshot bin into the correct location such that
   * when electron starts up it will load it.
   */
  installSnapshot () {
    // 1. Check that we performed all required steps
    assert(
      this.snapshotScript != null,
      'Run `createScript` and `makeSnapshot` first to create snapshot',
    )

    assert(
      this._flags.has(Flag.MakeSnapshot),
      'Cannot install when MakeSnapshot flag is not set',
    )

    assert(
      this.snapshotBinPath != null && fileExistsSync(this.snapshotBinPath),
      `Run \`makeSnapshot\` first to create snapshot bin file ${
        this.snapshotBinPath}`,
    )

    assert(
      this.v8ContextFile != null,
      'mksnapshot ran but v8ContextFile was not set',
    )

    // 2. Back up the original electron snapshot
    const electronV8ContextBin = installedElectronResourcesFilePath(
      this.projectBaseDir,
      this.v8ContextFile,
    )
    const electronResourcesDir = dirname(electronV8ContextBin)

    checkDirSync(electronResourcesDir)

    const v8ContextBackupName = backupName(this.v8ContextFile)
    const originalV8ContextBin = join(electronResourcesDir, v8ContextBackupName)

    if (!fileExistsSync(originalV8ContextBin)) {
      logInfo(
        `Backing up original electron v8-context to '${originalV8ContextBin}'`,
      )

      assert(
        fileExistsSync(electronV8ContextBin),
        'cannot find original electron snapshot',
      )

      fs.copyFileSync(electronV8ContextBin, originalV8ContextBin)
    }

    const v8ContextFullPath = join(this.snapshotBinDir, this.v8ContextFile)

    logInfo(`Moving ${this.v8ContextFile} to '${electronV8ContextBin}'`)
    fs.renameSync(v8ContextFullPath, electronV8ContextBin)

    // 3. Move the snapshot binary we want to install into the electron
    //    snapshot location
    const snapshotBinFile = basename(this.snapshotBinPath)
    const electronSnapshotBin = join(electronResourcesDir, snapshotBinFile)

    logInfo(`Moving ${snapshotBinFile} to ${electronSnapshotBin}`)
    fs.renameSync(this.snapshotBinPath, electronSnapshotBin)
  }

  /**
   * Convenience function that invokes `makeSnapshot` followed by
   * `installSnapshot`.
   */
  async makeAndInstallSnapshot () {
    const res = await this.makeSnapshot()

    if (res != null) {
      this.installSnapshot()

      return res
    }

    throw new Error('make snapshot failed')
  }

  private _verifyScript () {
    assert(this.snapshotScript != null, 'need snapshotScript to be set')
    this._snapshotVerifier.verify(this.snapshotScript, this.snapshotScriptPath)
  }
}
