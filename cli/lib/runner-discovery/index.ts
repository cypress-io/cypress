import path from 'path'

import { RunnerDiscoveryError } from './record'
import type { LiveRunnerState, ReadyRunnerState, RunnerDiscoveryRecord } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'
import { readRunnerRecords } from './store'

export { RunnerDiscoveryError, INSTANCES_DIRNAME } from './record'

export type { LiveRunnerState, ReadyRunnerState, RunnerDiscoveryErrorCode, RunnerDiscoveryRecord } from './record'

export { isPidAlive, verifyRunnerRecord } from './liveness'

export { getRunnerDiscoveryDir, pruneDeadDiscoveryRecords, readRunnerRecords } from './store'

export interface ListRunnerOptions {
  /** Optional project-root filter; omitted lists runners across all projects. */
  projectRoot?: string
  /** Optional pid filter; omitted lists every matching instance. */
  instance?: number
  /** Per-record liveness probe timeout. */
  probeTimeoutMs?: number
}

const matchesProject = (record: RunnerDiscoveryRecord, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

// The shared project/pid filter both `listLiveRunners` and `resolveRunner`
// apply. An undefined facet does not constrain, so an absent `--project` (every
// project) and an absent `--instance` (every pid) narrow records the same way.
const matchesFilters = (record: RunnerDiscoveryRecord, projectRoot: string | undefined, instance: number | undefined): boolean => {
  return (projectRoot === undefined || matchesProject(record, projectRoot))
    && (instance === undefined || record.pid === instance)
}

// Probe each pre-filtered record for liveness, concurrently. A dead pid is
// skipped without a probe (it proves the writer is gone); the survivors carry
// the live browser CDP state from their probe response.
const probeMatches = async (matches: RunnerDiscoveryRecord[], probeTimeoutMs?: number): Promise<LiveRunnerState[]> => {
  const probed = await Promise.all(matches.map(async (record) => {
    return isPidAlive(record.pid) ? verifyRunnerRecord(record, probeTimeoutMs) : null
  }))

  return probed.filter((runner): runner is LiveRunnerState => runner !== null)
}

/**
 * Enumerate every verified-live Cypress runner, optionally narrowed to a
 * project root and/or a specific pid. "No runners" is a valid, empty list,
 * never an error — this backs the `instances` command. Each result carries the
 * live browser CDP state from its probe response.
 */
export const listLiveRunners = async (options: ListRunnerOptions = {}): Promise<LiveRunnerState[]> => {
  const records = await readRunnerRecords()

  const matches = records.filter((record) => matchesFilters(record, options.projectRoot, options.instance))

  return probeMatches(matches, options.probeTimeoutMs)
}

/**
 * How {@link resolveRunner} settled on its target:
 * - `explicit`  — an explicit `--instance`/`--project` filter pinned the choice.
 * - `only`      — no filter, and exactly one runner was live.
 * - `cwd-match` — several were live; the one rooted at the cwd was chosen.
 * - `arbitrary` — several were live, none rooted at the cwd; lowest pid won.
 */
export type RunnerSelectionReason = 'explicit' | 'only' | 'cwd-match' | 'arbitrary'

export interface RunnerSelection {
  /** The chosen runner, guaranteed to have a browser attached. */
  runner: ReadyRunnerState
  /** How the runner was chosen. */
  reason: RunnerSelectionReason
  /** Count of verified-live runners that matched before disambiguation (>= 1). */
  candidateCount: number
}

export interface ResolveRunnerOptions {
  /** Explicit project-root filter; when omitted, every project is a candidate. */
  project?: string
  /** Explicit pid filter; when omitted, every matching instance is a candidate. */
  instance?: number
  /** Working directory, used only as a tiebreak when several runners are live. */
  cwd: string
  /** Per-record liveness probe timeout. */
  probeTimeoutMs?: number
}

// Phrase the filter that came up empty so the discovery errors name what the
// user actually asked for (a pid, a project, or nothing in particular).
const describeFilter = (project: string | undefined, instance: number | undefined): string => {
  if (instance !== undefined) {
    return ` with pid ${instance}`
  }

  if (project !== undefined) {
    return ` for ${project}`
  }

  return ''
}

const lowestPid = (runners: LiveRunnerState[]): LiveRunnerState => {
  // Directory read order is not guaranteed, so sort for a deterministic pick.
  return [...runners].sort((a, b) => a.pid - b.pid)[0]
}

// Pick one runner from the live set and record why. A single live runner is
// the target outright; with several, the cwd-rooted one wins, falling back to
// the lowest pid. Browser readiness is not a selection criterion — the caller
// requires it of whatever is chosen, mirroring the old findReadyRunner.
const selectRunner = (live: LiveRunnerState[], options: ResolveRunnerOptions): { runner: LiveRunnerState, reason: RunnerSelectionReason } => {
  if (live.length === 1) {
    const filtered = options.project !== undefined || options.instance !== undefined

    return { runner: live[0], reason: filtered ? 'explicit' : 'only' }
  }

  const cwdMatches = live.filter((record) => matchesProject(record, options.cwd))

  if (cwdMatches.length > 0) {
    return { runner: lowestPid(cwdMatches), reason: 'cwd-match' }
  }

  return { runner: lowestPid(live), reason: 'arbitrary' }
}

/**
 * Resolve the single Cypress runner a tap command should target, with the live
 * browser CDP state its session needs. With no `--instance`/`--project`, the
 * cwd is only a tiebreak: a lone running Cypress is used wherever it lives, and
 * several are disambiguated by the cwd then by lowest pid (see
 * {@link RunnerSelectionReason}). Explicit filters narrow the candidate set
 * first, exactly as `listLiveRunners` does.
 *
 * @throws {RunnerDiscoveryError} `NO_DISCOVERY_FILE` when no record matches the filters
 * @throws {RunnerDiscoveryError} `STALE_DISCOVERY_FILE` when records match but none verify as alive
 * @throws {RunnerDiscoveryError} `NO_BROWSER_ATTACHED` when the chosen runner is live but has no browser
 */
export const resolveRunner = async (options: ResolveRunnerOptions): Promise<RunnerSelection> => {
  const { project, instance, probeTimeoutMs } = options
  const records = await readRunnerRecords()

  const matches = records.filter((record) => matchesFilters(record, project, instance))

  if (matches.length === 0) {
    throw new RunnerDiscoveryError(
      'NO_DISCOVERY_FILE',
      `No Cypress instance found${describeFilter(project, instance)}. This command requires Cypress running in open mode. Start Cypress in open mode, open a browser, and try again.`,
    )
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new RunnerDiscoveryError(
      'STALE_DISCOVERY_FILE',
      `Cypress was previously running${describeFilter(project, instance)}, but is no longer responding. Cypress likely exited uncleanly; start Cypress in open mode, open a browser, and try again.`,
    )
  }

  const { runner, reason } = selectRunner(live, options)

  if (!runner.cdpBrowserWsUrl) {
    throw new RunnerDiscoveryError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running (pid ${runner.pid}, ${runner.projectRoot}), but no test browser is open. Open a browser in Cypress and try again.`,
    )
  }

  return { runner: runner as ReadyRunnerState, reason, candidateCount: live.length }
}
