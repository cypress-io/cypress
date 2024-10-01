import { strict as assert } from 'assert'
import debug from 'debug'
import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { circularImports } from './circular-imports'
import { createBundleAsync } from '../generator/create-snapshot-script'
import { AsyncScriptProcessor } from './process-script.async'
import type { CreateSnapshotScriptOpts, Entries, Metadata } from '../types'
import {
  bundleFileNameFromHash,
  createHash,
  ensureDirSync,
  tryRemoveFile,
} from '../utils'
import {
  stringifyWarning,
  Warning,
  WarningConsequence,
  WarningsProcessor,
} from './warnings-processor'

const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')
const logTrace = debug('cypress:snapgen:trace')
const logError = debug('cypress:snapgen:error')

/**
 * Configure the snapshot doctor
 *
 * @property previousDeferred See {@link GenerationOpts} previousDeferred
 * @property previousHealthy See {@link GenerationOpts} previousHealthy
 * @property previousNoRewrite See {@link GenerationOpts} previousNoRewrite
 * @property forceNoRewrite See {@link GenerationOpts} forceNoRewrite
 */
export type SnapshotDoctorOpts = Omit<
  CreateSnapshotScriptOpts,
  | 'deferred'
  | 'includeStrictVerifiers'
  | 'sourcemap'
  | 'sourcemapEmbed'
  | 'sourcemapInline'
  | 'sourcemapExternalPath'
> & {
  previousDeferred: Set<string>
  previousHealthy: Set<string>
  previousNoRewrite: Set<string>
  forceNoRewrite: Set<string>
}

/**
 * Tracks which modules have been deferred, need to be deferred and so on
 * during the doctor process
 */
class HealState {
  processedLeaves: boolean

  /**
   * Creates an instance of {@link HealState}.
   *
   * @param meta esbuild metadata {@link https://esbuild.github.io/api/#metafile}
   * @param healthy modules determined as healthy
   * @param deferred modules that need to be deferred
   * @param norewrite modules that cannot be rewritten
   * @param needDefer modules that need to be deferred but haven't been added
   * to `deferred` yet
   * @param needNorewrite modules that cannot be rewritten  but haven't been
   * added to `norewrite` yet
   */
  constructor (
    readonly meta: Readonly<Metadata>,
    readonly healthy: Set<string> = new Set(),
    readonly deferred: Set<string> = new Set(),
    readonly norewrite: Set<string> = new Set(),
    readonly needDefer: Set<string> = new Set(),
    readonly needNorewrite: Set<string> = new Set(),
  ) {
    this.processedLeaves = false
  }
}

/**
 * Sorts modules by leafness via these steps:
 *
 * 1. add leafs which are modules that import no other module
 * 2. add modules that have imports but all those imports have been added in
 *    a previous step
 * 3. Repeat 2. with updated `handled` Set until no all `entries` have ben
 *    added
 *
 * @param meta module metadata which contains information about which other
 * modules a module imports
 *
 * @param entries all modules that we need to handle
 *
 * @param circulars all modules which have circular imports which need to be
 * considered in order to avoid an infinite loop
 */
function sortModulesByLeafness (
  meta: Metadata,
  entries: Entries<Metadata['inputs']>,
  circulars: Map<string, Set<string>>,
) {
  const sorted: string[] = []
  const handled: Set<string> = new Set()

  while (handled.size < entries.length) {
    const justSorted: string[] = []

    // Include modules whose children have been included already
    for (const [key, { imports }] of entries) {
      if (handled.has(key)) continue

      const circular = circulars.get(key)
      const children = imports.map((x) => x.path)

      if (
        children.every(
          (x) => handled.has(x) || (circular != null && circular.has(x)),
        )
      ) {
        justSorted.push(key)
      }
    }
    // Sort them further by number of imports
    justSorted.sort((a, b) => {
      const lena = meta.inputs[a].imports.length
      const lenb = meta.inputs[b].imports.length

      return lena > lenb ? -1 : 1
    })

    for (const x of justSorted) {
      sorted.push(x)
      handled.add(x)
    }
  }

  return sorted
}

/**
 * Sorts all modules by leafness and filters out any module that is not part of
 * `deferred` modules.
 *
 * @param meta module metadata which contains information about which other
 * modules a module imports
 *
 * @param entries all modules that we need to handle
 *
 * @param circulars all modules which have circular imports which need to be
 * considered in order to avoid an infinite loop
 *
 * @param deferred modules that should be included in the result
 */
function sortDeferredByLeafness (
  meta: Metadata,
  entries: Entries<Metadata['inputs']>,
  circulars: Map<string, Set<string>>,
  deferred: Set<string>,
) {
  return sortModulesByLeafness(meta, entries, circulars).filter((x) => {
    return deferred.has(x)
  })
}

/**
 * Maps the given keys to relative paths
 */
function pathify (keys: Iterable<string>) {
  const xs: string[] = []

  for (const x of keys) {
    if (x.startsWith('.') || x.startsWith(path.sep)) {
      xs.push(x)
    } else {
      xs.push(`./${x}`)
    }
  }

  return xs
}
/**
 * Maps the given keys to relative paths and sorts them
 */
function pathifyAndSort (keys: Set<string>) {
  const xs = pathify(keys)

  xs.sort()

  return xs
}

/**
 * Maps the given paths to keys, i.e. the inverse of {@link pathify}.
 */
function unpathify (keys: Set<string>) {
  const unpathified: Set<string> = new Set()

  for (const x of keys) {
    if (!x.startsWith('./')) {
      unpathified.add(x)
    } else {
      unpathified.add(x.slice(2))
    }
  }

  return unpathified
}

/**
 * The snapshot doctor performs a series of steps in order to arrive at
 * metadata which distinguishes between non-problematic aka _healthy_ and
 * problematic aka _deferred_ and _norewrite_ modules.
 *
 * This metada is used when generating the final snapshot script to initialize
 * the snapshot.
 *
 * ## Snapshot Doctor Metadata
 *
 * - `norewrite`: modules that should not be rewritten when generating the
 *    snapshot script as
 * - `deferred`: modules that need to be deferred, that is they can not be
 *    initialized during snapshot initialization
 * - `healthy`: modules that can be fully initialized during snapshot
 *   initialization
 * - `deferredHashFile`: the file use to derive at the current project state
 *    hash, usually the local `yarn.lock`
 * - `deferredHash`: the hash of the `deferredHashFile` at the time that this
 *   metadata was generated
 *
 * The `hash` related properties tell the snapshot doctor for future runs if
 * the metadata can be used as is since the project state didn't change, i.e.
 * no dependencies were changed nor added or removed.
 *
 * If the `deferredHash` does not match the current state then the doctor
 * will start fresh, however if you pass one ore more of the following as part
 * of the {@link SnapshotDoctorOpts | snapshot opts} it will take those as a
 * starting point and complete much faster.
 *
 * ```ts
 * previousDeferred: Set<string>
 * previousHealthy: Set<string>
 * previousNoRewrite: Set<string>
 * ```
 *
 * ## Snapshot Doctor Steps
 *
 * When {@link SnapshotDoctor.heal} is invoked the doctor will keep adapting
 * the bundle that is generated by the bundle until it can be used to
 * initialize the snapshot without running into any issues.
 *
 * It does so by refining the health state and communicating it to the bundler
 * via a config which in turn produces a slightly different bundle each time,
 * designed to avoid those issues.
 */
export class SnapshotDoctor {
  private readonly baseDirPath: string
  private readonly entryFilePath: string
  private readonly bundlerPath: string
  private readonly nodeModulesOnly: boolean
  private readonly previousDeferred: Set<string>
  private readonly previousHealthy: Set<string>
  private readonly previousNoRewrite: Set<string>
  private readonly forceNoRewrite: Set<string>
  private readonly nodeEnv: string
  private readonly cypressInternalEnv: string
  private readonly _scriptProcessor: AsyncScriptProcessor
  private readonly _warningsProcessor: WarningsProcessor
  private readonly integrityCheckSource: string | undefined

  /**
   * Creates an instance of the {@link SnapshotDoctor}
   *
   * @param opts configures the _healing_ process of the doctor
   */
  constructor (opts: SnapshotDoctorOpts) {
    this.baseDirPath = opts.baseDirPath
    this.entryFilePath = opts.entryFilePath
    this.bundlerPath = opts.bundlerPath
    this._scriptProcessor = new AsyncScriptProcessor()
    this._warningsProcessor = new WarningsProcessor(this.baseDirPath)
    this.nodeModulesOnly = opts.nodeModulesOnly
    this.previousDeferred = unpathify(opts.previousDeferred)
    this.previousHealthy = unpathify(opts.previousHealthy)
    this.previousNoRewrite = unpathify(opts.previousNoRewrite)
    this.forceNoRewrite = unpathify(opts.forceNoRewrite)
    this.nodeEnv = opts.nodeEnv
    this.cypressInternalEnv = opts.cypressInternalEnv
    this.integrityCheckSource = opts.integrityCheckSource
  }

  /**
   * The healing process of a given app consists of the following main steps
   * which are described in more detail in the code below.
   *
   * 1. Produce an initial bundle and extract all modules from the metadata
   * 2. Start with an empty heal state or one derived from previous meta data
   * 3. Process the bundle which is generated respecting the current heal
   *    state and update the heal state via the issues we discover during that
   *    process
   * 4. Keep doing that until we arrive at a heal state which will result in a
   *    bundle that doesn't cause any issues when assembled into a snapshot script
   *    and used to initialize the snapshot
   * 5. Return that heal state as well as the last collected bundle and related
   *    metadata
   */
  async heal (): Promise<{
    healthy: string[]
    deferred: string[]
    norewrite: string[]
    bundle: Buffer
    meta: Metadata
  }> {
    // 1. Generate the metadata not deferring anything yet
    const { meta } = await this._createScript()

    // 2. Extract all module inputs from the metadata and detect circular
    // imports
    const entries = Object.entries(meta.inputs)
    const circulars = circularImports(meta.inputs, entries)

    logDebug({ circulars })

    const filterStaleImports = (imports: Set<string>) => {
      return new Set(Array.from(imports).filter((x) => !!meta.inputs[x]))
    }

    const filteredPreviousHealthy = filterStaleImports(this.previousHealthy)
    const filteredPreviousDeferred = filterStaleImports(this.previousDeferred)
    const filteredPreviousNoRewrite = filterStaleImports(this.previousNoRewrite)

    // 3. Initialize the heal state with data from previous runs that was
    //    provided to us
    //    forceNoRewrite is provided for modules which we manually determined
    //    to result in invalid/problematic code when rewritten
    const healState = new HealState(
      meta,
      filteredPreviousHealthy,
      filteredPreviousDeferred,
      new Set([...filteredPreviousNoRewrite, ...this.forceNoRewrite]),
    )

    // 4. Generate the initial bundle and warnings using what was done previously
    const { warnings, bundle } = await this._createScript(new Set(filteredPreviousDeferred), new Set([...filteredPreviousNoRewrite, ...this.forceNoRewrite]))

    // 5. Process the initial bundle in order to detect issues during
    //    verification
    //    The heal state we pass is mutated in this step
    await this._processCurrentScript(bundle, warnings, healState, circulars)

    // 6. As long as the heal state indicates there is work left todo we add
    //    problematic modules (needDefer and needNorewrite) to the appropriate
    //    set and repeat the process
    //    Each new run will defer/norewrite more and more modules until we
    //    arrive at a snapshot script that passes verification
    while (healState.needDefer.size > 0 || healState.needNorewrite.size > 0) {
      for (const x of healState.needDefer) {
        healState.deferred.add(x)
        healState.healthy.delete(x)
      }
      for (const x of healState.needNorewrite) {
        healState.norewrite.add(x)
        healState.healthy.delete(x)
      }

      const { warnings, bundle } = await this._createScript(
        healState.deferred,
        healState.norewrite,
      )

      healState.needDefer.clear()
      healState.needNorewrite.clear()
      await this._processCurrentScript(bundle, warnings, healState, circulars)
    }

    // 7. Sort results
    const sortedDeferred = sortDeferredByLeafness(
      meta,
      entries,
      circulars,
      healState.deferred,
    )

    const sortedNorewrite = Array.from(healState.norewrite).sort()

    logInfo({ allDeferred: sortedDeferred, len: sortedDeferred.length })
    logInfo({ norewrite: sortedNorewrite, len: sortedNorewrite.length })

    // 8. Cleanup
    await this._scriptProcessor.dispose()

    // 9. Return collected metadata as well as the bundle that respected the
    //    collected heal state
    return {
      healthy: pathifyAndSort(healState.healthy),
      deferred: pathifyAndSort(new Set(sortedDeferred)),
      norewrite: pathify(sortedNorewrite),
      bundle,
      meta,
    }
  }

  private async _writeBundle (bundle: Buffer) {
    const bundleTmpDir = path.join(tmpdir(), 'v8-snapshot')

    ensureDirSync(bundleTmpDir)
    const bundleHash = createHash(bundle)
    const filename = bundleFileNameFromHash(bundleHash)
    const bundlePath = path.join(bundleTmpDir, filename)

    await fs.promises.writeFile(bundlePath, bundle)

    return { bundleHash, bundlePath }
  }

  /**
   * The bundler produced a bundle respecting the current heal state.
   * Now we need to test different modules as entry points in order to identify
   * if initializing a particular module in isolation would cause issues.
   *
   * Note that even though we use the same bundle, by changing the entry point
   * we can check multiple modules with it.
   *
   * We first look at the warnings and take the needed consequence for some of
   * them, either marking a module to be deferred or as not rewritable.
   *
   * The bundle is invalid if we encountered extra modules that cannot be
   * rewritten. In that case we return immediately causing a new bundle to be
   * generated that doesn't have rewrites for those modules.
   *
   * @param bundle the bundle returned by the bundler
   * @param warnings the warnings emitted by the bundler
   * @param healState current heal state
   * @param circulars circular imports
   * @private
   */
  private async _processCurrentScript (
    bundle: Buffer,
    warnings: Warning[],
    healState: HealState,
    circulars: Map<string, Set<string>>,
  ) {
    // 1. Filter out warnings we've seen before and map them to warnings that
    //    signal the consequence
    const processedWarnings = this._warningsProcessor.process(warnings, {
      deferred: healState.deferred,
      norewrite: healState.norewrite,
    })

    for (const warning of processedWarnings) {
      const s = stringifyWarning(this.baseDirPath, warning)

      switch (warning.consequence) {
        case WarningConsequence.Defer:
          logError('Encountered warning triggering defer: %s', s)
          healState.needDefer.add(warning.location.file)
          break
        case WarningConsequence.NoRewrite:
          logError('Encountered warning triggering no-rewrite: %s', s)
          healState.needNorewrite.add(warning.location.file)
          break
        case WarningConsequence.None:
          logDebug('Encountered warning without consequence: %s', s)
          break
        default:
          break
      }
    }

    // If norewrite is required we actually need to rebuild the bundle so we
    // exit early
    if (healState.needNorewrite.size > 0) {
      return
    }

    // 3. Write the bundle so that the workers can read it in order to assemble
    // the snapshot script from it
    logInfo('Preparing to process current script')
    const { bundleHash, bundlePath } = await this._writeBundle(bundle)

    logDebug('Stored bundle file (%s)', bundleHash)
    logTrace(bundlePath)
    /* START using (bundlePath) */ {
      // 4. Obtain the set of modules we need to verify as healthy until no
      //    more can be verified until a new bundle is created which will
      //    respect the heal state we're obtaining
      for (
        let nextStage = this._findNextStage(healState, circulars);
        nextStage.length > 0;
        nextStage = this._findNextStage(healState, circulars)
      ) {
        // 5. Process the module verification in parallel
        const promises = nextStage.map(async (key): Promise<void> => {
          logDebug('Testing entry in isolation "%s"', key)
          // 5.1. The script processor distributes processing modules across
          // multiple worker threads
          const result = await this._scriptProcessor.processScript({
            bundlePath,
            bundleHash,
            baseDirPath: this.baseDirPath,
            entryFilePath: this.entryFilePath,
            entryPoint: `./${key}`,
            nodeEnv: this.nodeEnv,
            cypressInternalEnv: this.cypressInternalEnv,
            supportTypeScript: this.nodeModulesOnly,
            integrityCheckSource: this.integrityCheckSource,
          })

          assert(result != null, 'expected result from script processor')

          // 5.2. Query the outcome and depending on its consequence mark
          //      modules as healthy, deferred or non-rewritable
          switch (result.outcome) {
            case 'completed': {
              healState.healthy.add(key)
              logDebug('Verified as healthy "%s"', key)
              break
            }
            case 'failed:assembleScript':
            case 'failed:verifyScript': {
              logError('%s script with entry "%s"', result.outcome, key)
              logError(result.error!.toString())

              const warning = this._warningsProcessor.warningFromError(
                result.error!,
                key,
                healState,
              )

              if (warning != null) {
                switch (warning.consequence) {
                  case WarningConsequence.Defer: {
                    logInfo('Deferring "%s"', key)
                    healState.needDefer.add(key)
                    break
                  }
                  case WarningConsequence.NoRewrite: {
                    logInfo(
                      'Not rewriting "%s" as it results in incorrect code',
                      key,
                    )

                    healState.needNorewrite.add(key)
                    break
                  }
                  case WarningConsequence.None: {
                    // eslint-disable-next-line no-console
                    console.error(result.error)
                    assert.fail('I do not know what to do with this error')
                    break
                  }
                  default:
                    break
                }
              }

              break
            }
            default:
              break
          }
        })

        await Promise.all(promises)
      }
    } /* END using (bundlePath) */

    // 6. Remove the bundle file in order to not flood our /tmp folder
    logDebug('Removing bundle file (%s)', bundleHash)
    logTrace(bundlePath)
    const err = await tryRemoveFile(bundlePath)

    if (err != null) {
      logError('Failed to remove bundle file', err)
    }
  }

  /**
   * Creates a bundle providing the modules that should be deferred or not
   * rewritten to the bundler.
   *
   * The bundler will rewrite the code such that deferreds are wrapped inside
   * functions and only resolved once accessed.
   * The bundler only transpiles code of modules that should not be rewritten
   * but doesn't rewrite it in any way.
   *
   * The resulting bundle is then wrapped inside a snapshot script.
   *
   * @private
   */
  private async _createScript (
    deferred?: Set<string>,
    norewrite?: Set<string>,
  ): Promise<{
    meta: Metadata
    bundle: Buffer
    warnings: Warning[]
  }> {
    const deferredArg = deferred == null ? undefined : Array.from(deferred)
    const norewriteArg = norewrite == null ? undefined : Array.from(norewrite)

    try {
      const { warnings, meta, bundle } = await createBundleAsync({
        baseDirPath: this.baseDirPath,
        entryFilePath: this.entryFilePath,
        bundlerPath: this.bundlerPath,
        nodeModulesOnly: this.nodeModulesOnly,
        sourcemap: false,
        includeStrictVerifiers: true,
        deferred: deferredArg,
        norewrite: norewriteArg,
        supportTypeScript: this.nodeModulesOnly,
        integrityCheckSource: this.integrityCheckSource,
      })

      return { warnings, meta: meta as Metadata, bundle }
    } catch (err) {
      logError('Failed creating initial bundle')
      throw err
    }
  }

  /**
   * Finds the next set modules that we should verify to be healthy or not or
   * empty if no more can be verified.
   *
   * @param healState current heal state
   * @param circulars circular imports
   * @private
   */
  private _findNextStage (
    healState: HealState,
    circulars: Map<string, Set<string>>,
  ) {
    if (healState.processedLeaves) {
      return this._findVerifiables(healState, circulars)
    }

    healState.processedLeaves = true
    const nextStage = this._findLeaves(healState)

    return nextStage.length === 0 ? this._findVerifiables(healState, circulars) : nextStage
  }

  /**
   * Finds all modules that import no other modules.
   * This is only called the very first time during the doctor process.
   *
   * @param healState current heal state
   * @private
   */
  private _findLeaves (healState: HealState) {
    const leaves: string[] = []

    for (const [key, { imports }] of Object.entries(healState.meta.inputs)) {
      if (
        healState.healthy.has(key) ||
        healState.deferred.has(key) ||
        healState.norewrite.has(key)
      ) {
        continue
      }

      if (imports.length === 0) leaves.push(key)
    }

    return leaves
  }

  /**
   * Finds modules that only depend on previously handled modules and thus can
   * be verified at this point.
   *
   * If no such modules are found it returns an empty array.
   *
   * @param healState current heal state
   * @param circulars circular imports
   * @private
   */
  private _findVerifiables (
    healState: HealState,
    circulars: Map<string, Set<string>>,
  ) {
    const verifiables: string[] = []

    for (const [key, { imports }] of Object.entries(healState.meta.inputs)) {
      if (healState.needNorewrite.has(key)) continue

      if (healState.needDefer.has(key)) continue

      if (
        this._wasHandled(
          key,
          healState.healthy,
          healState.deferred,
          healState.norewrite,
        )
      ) {
        continue
      }

      const circular = circulars.get(key) ?? new Set()
      const allImportsHandledOrCircular = imports.every(
        (x) => {
          return this._wasHandled(
            x.path,
            healState.healthy,
            healState.deferred,
            healState.norewrite,
          ) || circular.has(x.path)
        },
      )

      if (allImportsHandledOrCircular) verifiables.push(key)
    }

    return verifiables
  }

  private _wasHandled (
    key: string,
    healthy: Set<string>,
    deferred: Set<string>,
    norewrite: Set<string>,
  ) {
    return healthy.has(key) || deferred.has(key) || norewrite.has(key)
  }
}
