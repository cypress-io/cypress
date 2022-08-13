import { strict as assert } from 'assert'
import debug from 'debug'
import fs from 'fs'
import { dirname, join, basename } from 'path'
import { minify } from 'terser'
import { createSnapshotScript, SnapshotScript } from './create-snapshot-script'
import { SnapshotVerifier } from './snapshot-verifier'
import { determineDeferred } from './doctor/determine-deferred'
import {
  backupName,
  checkDirSync,
  installedElectronResourcesFilePath,
  ensureDirSync,
  fileExistsSync,
  getBundlerPath,
  resolveElectronVersion,
} from './utils'
import { createExportScript, ExportScript } from './create-snapshot-bundle'
import { Flag, GeneratorFlags } from './snapshot-generator-flags'
import { syncAndRun } from '@packages/electron-mksnapshot'

const logInfo = debug('snapgen:info')
const logDebug = debug('snapgen:debug')
const logError = debug('snapgen:error')

/**
 * Configure snapshot creation.
 *
 * @property verify if `true` the snapshot script will be verified for correctness and snapshot-ability
 *
 * @property minify if `true` the snapshot script will be minified before creating a snapshot from it (this is not actively used as no benefits from this were observed)
 *
 * @property skipWriteOnVerificationFailure if `true` the snapshot script will not be written to the file system if verification fails
 *
 * @property cacheDir the path to store the snapshot script and all snapshot generation related meta data in
 *
 * @property snapshotBinDir the path where to store the generated snapshot binary (before it is installed)
 *
 * @property nodeModulesOnly if `true` only node modules will be included in the snapshot and app modules are omitted
 *
 * @property sourcemapEmbed if `true` a sourcemap of modules included in the snapshot is embedded in the snapshot itself
 *
 * @property sourcemapInline if `true` a sourcemap of modules included in the snapshot is inlined into the snapshot script
 *
 * @property includeStrictVerifiers if `true` the snapshot script will include
 * overrides to ensure that specific snapshot incompatible accesses, i.e. to a
 * `Promise` constructor don't run during module initialization.
 * This is turned on during the doctor step.
 *
 * @property previousHealthy relative paths to modules that were previously
 * determined to be _healthy_ that is they can be included into the snapshot
 * without being deferred
 *
 * @property previousDeferred relative paths to modules that were previously
 * determnied as problematic, that is it cannot be initialized during snapshot
 * creation and thus need to be _deferred_ during snapshot creation
 *
 * @property previousNoRewrite relative paths to modules that were previously
 * determined to result in invalid code when the snapshot bundler rewrites
 * their code and thus should not be rewritten
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
 * from which a module was resolved concatentated with the import request
 * string (seprated by `'***'`, see ./loading/snapshot-require
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
 * @property auxiliaryData any additional data to embed into the snapshot
 *
 * @property electronVersion the version of electron we're targeting with this
 * snapshot
 *
 * @property maxWorkers the maximum amounts of workers to spawn in order to run
 * verfications of a particular snapshot script provided different entry points
 * in parallel (more info see ./doctor/snapshot-doctor.ts)
 *
 * @property flags snapshot script creation flags
 *
 * @property nodeEnv the string to provide to `process.env.NODE_ENV` during
 * snapshot creation
 *
 * @property addCacheGitignore if `true` a `.gitignore` file is written to the
 * `cacheDir` ignoring large artifacts like the snapshot script
 *
 * @category snapshot
 */
export type GenerationOpts = {
  verify: boolean
  minify: boolean
  skipWriteOnVerificationFailure: boolean
  cacheDir: string
  snapshotBinDir: string
  nodeModulesOnly: boolean
  sourcemapEmbed: boolean
  sourcemapInline: boolean
  includeStrictVerifiers: boolean
  previousHealthy?: string[]
  previousDeferred?: string[]
  previousNoRewrite?: string[]
  forceNoRewrite?: string[]
  resolverMap?: Record<string, string>
  auxiliaryData?: Record<string, any>
  electronVersion?: string
  maxWorkers?: number
  flags: Flag
  nodeEnv: string
  addCacheGitignore: boolean
}

function getDefaultGenerationOpts (projectBaseDir: string): GenerationOpts {
  return {
    verify: true,
    minify: false,
    skipWriteOnVerificationFailure: false,
    cacheDir: join(projectBaseDir, 'cache'),
    snapshotBinDir: projectBaseDir,
    nodeModulesOnly: true,
    sourcemapEmbed: false,
    sourcemapInline: false,
    includeStrictVerifiers: false,
    previousDeferred: [],
    previousHealthy: [],
    flags: Flag.Script | Flag.MakeSnapshot | Flag.ReuseDoctorArtifacts,
    nodeEnv: 'development',
    addCacheGitignore: true,
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
  /** See {@link GenerationOpts} verify */
  private readonly verify: boolean
  /** See {@link GenerationOpts} minify */
  private readonly minify: boolean
  /** See {@link GenerationOpts} skipWriteOnVerificationFailure */
  private readonly skipWriteOnVerificationFailure: boolean
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
  /** See {@link GenerationOpts} sourcemapEmbed */
  private readonly sourcemapEmbed: boolean
  /** See {@link GenerationOpts} sourcemapInline */
  private readonly sourcemapInline: boolean
  /** See {@link GenerationOpts} includeStrictVerifiers */
  private readonly includeStrictVerifiers: boolean
  /** See {@link GenerationOpts} ?: */
  private readonly maxWorkers?: number
  /** See {@link GenerationOpts} previousDeferred */
  private readonly previousDeferred: Set<string>
  /** See {@link GenerationOpts} previousHealthy */
  private readonly previousHealthy: Set<string>
  /** See {@link GenerationOpts} previousNoRewrite */
  private readonly previousNoRewrite: Set<string>
  /** See {@link GenerationOpts} forceNoRewrite */
  private readonly forceNoRewrite: Set<string>
  /** See {@link GenerationOpts} nodeEnv */
  private readonly nodeEnv: string
  /**
   * Path to the Go bundler binary used to generate the bundle with rewritten code
   * {@link https://github.com/cypress-io/esbuild/tree/thlorenz/snap}
   */
  private readonly bundlerPath: string
  /** See {@link GenerationOpts} addCacheGitignore */
  private readonly addCacheGitignore: boolean
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
      verify,
      minify,
      skipWriteOnVerificationFailure,
      cacheDir,
      snapshotBinDir,
      maxWorkers,
      nodeModulesOnly,
      sourcemapEmbed,
      sourcemapInline,
      includeStrictVerifiers,
      previousDeferred,
      previousHealthy,
      previousNoRewrite,
      forceNoRewrite,
      flags: mode,
      nodeEnv,
      electronVersion,
      addCacheGitignore,
    }: GenerationOpts = Object.assign(
      getDefaultGenerationOpts(projectBaseDir),
      opts,
    )

    ensureDirSync(cacheDir)
    ensureDirSync(snapshotBinDir)

    this._snapshotVerifier = new SnapshotVerifier()
    this.verify = verify
    this.minify = minify
    this.skipWriteOnVerificationFailure = skipWriteOnVerificationFailure
    this.cacheDir = cacheDir
    this.snapshotBinDir = snapshotBinDir
    this.snapshotScriptPath = join(cacheDir, 'snapshot.js')
    this.snapshotExportScriptPath = join(cacheDir, 'snapshot-bundle.js')
    this.auxiliaryData = opts.auxiliaryData
    this.resolverMap = opts.resolverMap
    this.electronVersion =
      electronVersion ?? resolveElectronVersion(projectBaseDir)

    this.nodeModulesOnly = nodeModulesOnly
    this.sourcemapEmbed = sourcemapEmbed
    this.sourcemapInline = sourcemapInline
    this.includeStrictVerifiers = includeStrictVerifiers
    this.previousDeferred = new Set(previousDeferred)
    this.previousHealthy = new Set(previousHealthy)
    this.previousNoRewrite = new Set(previousNoRewrite)
    this.forceNoRewrite = new Set(forceNoRewrite)
    this.maxWorkers = maxWorkers
    this.nodeEnv = nodeEnv
    this._flags = new GeneratorFlags(mode)
    this.bundlerPath = getBundlerPath()
    this.addCacheGitignore = addCacheGitignore

    const auxiliaryDataKeys = Object.keys(this.auxiliaryData || {})

    logInfo({
      projectBaseDir,
      cacheDir,
      snapshotBinDir,
      snapshotScriptPath: this.snapshotScriptPath,
      nodeModulesOnly: this.nodeModulesOnly,
      sourcemapEmbed: this.sourcemapEmbed,
      sourcemapInline: this.sourcemapInline,
      includeStrictVerifiers: this.includeStrictVerifiers,
      previousDeferred: this.previousDeferred.size,
      previousHealthy: this.previousHealthy.size,
      previousNoRewrite: this.previousNoRewrite.size,
      forceNoRewrite: this.forceNoRewrite.size,
      auxiliaryData: auxiliaryDataKeys,
      verify,
      addCacheGitignore,
    })
  }

  private _addGitignore () {
    const gitignore = 'snapshot.js\nsnapshot.js.map\nesbuild-meta.json'

    const gitignorePath = join(this.cacheDir, '.gitignore')

    return fs.promises.writeFile(gitignorePath, gitignore)
  }

  /**
   * Creates the snapshot script for the provided configuration
   */
  async createScript () {
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
          maxWorkers: this.maxWorkers,
          nodeModulesOnly: this.nodeModulesOnly,
          previousDeferred: this.previousDeferred,
          previousHealthy: this.previousHealthy,
          previousNoRewrite: this.previousNoRewrite,
          forceNoRewrite: this.forceNoRewrite,
          useHashBasedCache: this._flags.has(Flag.ReuseDoctorArtifacts),
          nodeEnv: this.nodeEnv,
        },
      ))
    } catch (err) {
      logError('Failed obtaining deferred modules to create script')
      throw err
    }

    let result: SnapshotScript
    const sourcemapExternalPath = `${this.snapshotScriptPath}.map`

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
        sourcemapEmbed: this.sourcemapEmbed,
        sourcemapInline: this.sourcemapInline,
        sourcemap: true,
        sourcemapExternalPath,
        nodeEnv: this.nodeEnv,
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
    //    errors w verify that the generated script is snapshot-able.
    if (this.verify) {
      logInfo('Verifying snapshot script')
      try {
        this._verifyScript()
      } catch (err) {
        if (!this.skipWriteOnVerificationFailure) {
          logInfo(
            `Script failed verification, writing to ${this.snapshotScriptPath}`,
          )

          await fs.promises.writeFile(
            this.snapshotScriptPath,
            this.snapshotScript,
          )
        }

        throw err
      }
    } else {
      logInfo('Skipping snapshot script verification')
    }

    logInfo(`Writing snapshot script to ${this.snapshotScriptPath}`)

    // Optionally minify, but I haven't seen any gains from doing that since
    // the exports and/or export definitions are included in the snapshot
    // and not the code itself
    if (this.minify) {
      logInfo('Minifying snapshot script')
      const minified = await minify(this.snapshotScript!.toString(), {
        sourceMap: false,
      })

      assert(minified.code != null, 'Should return minified code')

      return fs.promises.writeFile(this.snapshotScriptPath, minified.code)
    }

    if (this.addCacheGitignore) {
      await this._addGitignore()
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
          maxWorkers: this.maxWorkers,
          nodeModulesOnly: this.nodeModulesOnly,
          previousHealthy: this.previousHealthy,
          previousDeferred: this.previousDeferred,
          previousNoRewrite: this.previousNoRewrite,
          forceNoRewrite: this.forceNoRewrite,
          useHashBasedCache: this._flags.has(Flag.ReuseDoctorArtifacts),
          nodeEnv: this.nodeEnv,
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
        includeStrictVerifiers: this.includeStrictVerifiers,
        deferred,
        norewrite,
        nodeModulesOnly: this.nodeModulesOnly,
        sourcemapEmbed: false,
        sourcemapInline: false,
        sourcemap: false,
        resolverMap: this.resolverMap,
        auxiliaryData: this.auxiliaryData,
        nodeEnv: this.nodeEnv,
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
      const bin = require.resolve('@thlorenz/mksnapshot/dist/mksnapshot-bin')
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
    const args = [this.snapshotScriptPath, '--output_dir', this.snapshotBinDir]

    try {
      const { snapshotBlobFile, v8ContextFile } = await syncAndRun(
        this.electronVersion,
        args,
      )

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

        return null
      }

      return { v8ContextFile: this.v8ContextFile! }
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

    const v8ContextFullPath = join(this.projectBaseDir, this.v8ContextFile)

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
