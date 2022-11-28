import type { CreateBundleResult } from '@tooling/packherd'
import path from 'path'

/**
 * Marker that the
 * {@link https://github.com/cypress-io/esbuild/tree/thlorenz/snap | snapshot bundler}
 * includes to indicate that rewriting the module's code resulted in invalid JavaScript.
 * @category snapshot
 */
export const SNAPSHOT_REWRITE_FAILURE = '[SNAPSHOT_REWRITE_FAILURE]'

/**
 * Marker that the
 * {@link https://github.com/cypress-io/esbuild/tree/thlorenz/snap | snapshot bundler}
 * includes to indicate that the module includes code that would cause issues
 * during snapshot generation and thus needs to be deferred.
 * @category snapshot
 */
export const SNAPSHOT_CACHE_FAILURE = '[SNAPSHOT_CACHE_FAILURE]'

/**
 * This error is raised for missing Node.js globals like Buffer
 * @category snapshot
 */
export const REFERENCE_ERROR_DEFER =
  /^(Reference|Type)?Error: (.+ is not defined|Cannot read property|Cannot read properties)/i

/**
 * This error is raised due to missing functions, most likely due to incorrect rewrite
 * Note that the `__.+__ is not defined` part catches rewrite errors that led to a functions
 * replacement to be used before defined or similar
 * @category snapshot
 */
export const REFERENCE_ERROR_NOREWRITE =
  /^(Reference|Type)?Error: (.+ is not a function|__.+__ is not defined)/i

/**
 * The history of warnings we processed already.
 * We keep it in order to avoid logging the same warning over and over
 * @category snapshot
 */
export type WarningsProcessHistory = {
  deferred: Set<string>
  norewrite: Set<string>
}

/**
 * The consequence of a specific type of warning.
 *
 * - Defer: we need to defer the module in order to prevent it from loading
 * - NoRewrite: we should not rewrite the module as it results in invalid code
 * - None: no consequence, i.e. a light weight warning for informative purposes only
 * @category snapshot
 */
export enum WarningConsequence {
  Defer,
  NoRewrite,
  None,
}

/**
 * The warning as we receive it from the bundler.
 * See {@link CreateBundleResult} warnings.
 * @category snapshot
 */
export type Warning = CreateBundleResult['warnings'][number]

/**
 * A {@link Warning} that has been processed to resolve the location in the
 * file that triggered the warning as well as the consequence.
 * @category snapshot
 */
export type ProcessedWarning = {
  location: Warning['location'] & { fullPath: string }
  consequence: WarningConsequence
  text: Warning['text']
}

/**
 * Converts a {@link ProcessedWarning} into a summary that we can log to the
 * console.
 * @category snapshot
 */
export function stringifyWarning (
  projectBaseDir: string,
  warning: ProcessedWarning,
) {
  const loc = warning.location
  const p = path.relative(projectBaseDir, loc.fullPath)

  return `
    ${warning.text} at ./${p}:${loc.line}:${loc.column} (${loc.file})
      | ${loc.line} ${warning.location.lineText}
      | ${' '.repeat(loc.column + loc.line.toString().length)} ^
  `
}

/**
 * Processes raw {@link Warning}s emitted from the snapshot bundler.
 *
 * Determines what {@link WarningConsequence} for the module where the it
 * originated the warning has as well as preparing it for printing to the
 * console.
 * @category snapshot
 */
export class WarningsProcessor {
  /**
   * Creates an instance of the {@link WarningsProcessor}.
   *
   * @param _projectBasedir root of the project which we are currently snapshotting
   * @param _warningsWithoutConsequenceReported the warnings of no consequence reported earlier
   * @category snapshot
   */
  constructor (
    private readonly _projectBasedir: string,
    private readonly _warningsWithoutConsequenceReported: Set<string> = new Set(),
  ) {}

  /**
   * Takes a list of warnings as well as a history of warnings processed previously.
   * It then processes each warning in a {@link ProcessedWarning}, filters out
   * the ones already processed previously and returns the remaining ones.
   *
   * The consequence of the warning is determined by parsing its {@link
   * Warning} text via regexes and string comparisons and thus is highly
   * dependent on the format in which the
   * {@link https://github.com/cypress-io/esbuild/tree/thlorenz/snap | snapshot bundler} emits them.
   *
   * @param warnings warnings emitted by the snapshot script bundler
   * @param hist history of previously processed warnings
   * @category snapshot
   */
  public process (
    warnings: Warning[],
    hist: WarningsProcessHistory,
  ): ProcessedWarning[] {
    return warnings
    .map((x) => this._processWarning(x, hist))
    .filter(
      (x: ProcessedWarning | null): boolean => x != null,
    ) as ProcessedWarning[]
  }

  private _processWarning (
    warning: Omit<Warning, 'detail' | 'notes' | 'pluginName' | 'id'>,
    hist: WarningsProcessHistory,
  ): ProcessedWarning | null {
    // We cannot do anything useful if we don't know what file the warning pertains to
    if (warning.location == null) return null

    const fullPath = path.resolve(this._projectBasedir, warning.location.file)
    const location = Object.assign({}, warning.location, { fullPath })
    const text = warning.text.trim()

    // NOTE: we are checking for rewrite indicators first as the regexes overlap

    // prettier-ignore
    const consequence =
           text.includes(SNAPSHOT_REWRITE_FAILURE)
        || REFERENCE_ERROR_NOREWRITE.test(text) ? WarningConsequence.NoRewrite
             : text.includes(SNAPSHOT_CACHE_FAILURE)
        || REFERENCE_ERROR_DEFER.test(text) ? WarningConsequence.Defer
               : WarningConsequence.None

    // We don't know what this warning means, just pass it along with no consequence
    return this._nullIfAlreadyProcessed(
      {
        location,
        text,
        consequence,
      },
      hist,
    )
  }

  private _nullIfAlreadyProcessed (
    x: ProcessedWarning,
    { deferred, norewrite }: WarningsProcessHistory,
  ) {
    if (x == null) return null

    switch (x.consequence) {
      case WarningConsequence.Defer: {
        if (deferred.has(x.location.file)) return null

        return x
      }
      case WarningConsequence.NoRewrite: {
        if (norewrite.has(x.location.file)) return null

        return x
      }
      case WarningConsequence.None: {
        if (this._warningsWithoutConsequenceReported.has(x.location.file)) {
          return null
        }

        this._warningsWithoutConsequenceReported.add(x.location.file)

        return x
      }
      default:
        return null
    }
  }

  /**
   * Converts an error that was raised during verification of the script via
   * the {@link SnapshotVerifier} to a {@link ProcessedWarning}.
   *
   * @param err the error
   * @param file relative path to the file from which the error originated
   * @param hist history of previously processed warnings
   * @category snapshot
   */
  warningFromError (err: Error, file: string, hist: WarningsProcessHistory) {
    let location: Warning['location'] = {
      file,
      namespace: 'file:',
      line: 1,
      column: 0,
      length: 0,
      lineText: '<unknown>',
      suggestion: '',
    }
    let text = err.toString()

    let warning: Omit<Warning, 'detail' | 'notes' | 'pluginName' | 'id'> = {
      location,
      text,
    }

    return this._processWarning(warning, hist)
  }
}
