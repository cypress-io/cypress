import path from 'path'

import { CypressInstanceError } from './record'
import type { LiveInstanceState, ReadyInstanceState, CypressInstance } from './record'
import { isPidAlive, verifyInstanceRecord } from './liveness'
import { readInstanceRecords } from './store'

export { CypressInstanceError, INSTANCES_DIRNAME } from './record'

export type { LiveInstanceState, ReadyInstanceState, CypressInstanceErrorCode, CypressInstance } from './record'

export { isPidAlive, verifyInstanceRecord } from './liveness'

export { getInstancesDir, pruneDeadInstanceRecords, readInstanceRecords } from './store'

export interface ListInstanceOptions {
  /** Optional project-root filter; omitted lists instances across all projects. */
  projectRoot?: string
  /** Optional pid filter; omitted lists every matching instance. */
  instance?: number
  probeTimeoutMs?: number
}

const matchesProject = (record: CypressInstance, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

// An undefined facet does not constrain, so an absent `--project` (every
// project) and an absent `--instance` (every pid) narrow records the same way.
const matchesFilters = (record: CypressInstance, projectRoot: string | undefined, instance: number | undefined): boolean => {
  return (projectRoot === undefined || matchesProject(record, projectRoot))
    && (instance === undefined || record.pid === instance)
}

// A dead pid is skipped without a probe (it proves the writer is gone); the
// survivors carry the live browser CDP state from their probe response.
const probeMatches = async (matches: CypressInstance[], probeTimeoutMs?: number): Promise<LiveInstanceState[]> => {
  const probed = await Promise.all(matches.map(async (record) => {
    return isPidAlive(record.pid) ? verifyInstanceRecord(record, probeTimeoutMs) : null
  }))

  return probed.filter((instance): instance is LiveInstanceState => instance !== null)
}

/**
 * Enumerate every verified-live Cypress instance, optionally narrowed to a
 * project root and/or a specific pid. "No instances" is a valid, empty list,
 * never an error — this backs the `instances` command.
 */
export const listLiveInstances = async (options: ListInstanceOptions = {}): Promise<LiveInstanceState[]> => {
  const records = await readInstanceRecords()

  const matches = records.filter((record) => matchesFilters(record, options.projectRoot, options.instance))

  return probeMatches(matches, options.probeTimeoutMs)
}

/**
 * How {@link resolveInstance} settled on its target:
 * - `explicit`  — an explicit `--instance`/`--project` filter pinned the choice.
 * - `only`      — no filter, and exactly one instance was live.
 * - `cwd-match` — several were live; the one rooted at the cwd was chosen.
 * - `arbitrary` — several were live, none rooted at the cwd; lowest pid won.
 */
export type InstanceSelectionReason = 'explicit' | 'only' | 'cwd-match' | 'arbitrary'

export interface InstanceSelection {
  /** The chosen instance, guaranteed to have a browser attached. */
  instance: ReadyInstanceState
  reason: InstanceSelectionReason
  /** Count of verified-live instances that matched before disambiguation (>= 1). */
  candidateCount: number
}

export interface ResolveInstanceOptions {
  /** Explicit project-root filter; when omitted, every project is a candidate. */
  project?: string
  /** Explicit pid filter; when omitted, every matching instance is a candidate. */
  instance?: number
  /** Working directory, used only as a tiebreak when several instances are live. */
  cwd: string
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

const lowestPid = (instances: LiveInstanceState[]): LiveInstanceState => {
  // Directory read order is not guaranteed, so sort for a deterministic pick.
  return [...instances].sort((a, b) => a.pid - b.pid)[0]
}

// Browser readiness is not a selection criterion — the caller requires it of
// whatever is chosen.
const selectInstance = (live: LiveInstanceState[], options: ResolveInstanceOptions): { instance: LiveInstanceState, reason: InstanceSelectionReason } => {
  if (live.length === 1) {
    const filtered = options.project !== undefined || options.instance !== undefined

    return { instance: live[0], reason: filtered ? 'explicit' : 'only' }
  }

  const cwdMatches = live.filter((record) => matchesProject(record, options.cwd))

  if (cwdMatches.length > 0) {
    return { instance: lowestPid(cwdMatches), reason: 'cwd-match' }
  }

  return { instance: lowestPid(live), reason: 'arbitrary' }
}

/**
 * Resolve the single Cypress instance a tap command should target, with its live
 * browser CDP state. With no `--instance`/`--project`, the cwd is only a
 * tiebreak: a lone running Cypress is used wherever it lives, and several are
 * disambiguated by the cwd then by lowest pid (see {@link InstanceSelectionReason}).
 *
 * @throws {CypressInstanceError} `NO_INSTANCE` when no record matches the filters
 * @throws {CypressInstanceError} `STALE_INSTANCE` when records match but none verify as alive
 * @throws {CypressInstanceError} `NO_BROWSER_ATTACHED` when the chosen instance is live but has no browser
 */
export const resolveInstance = async (options: ResolveInstanceOptions): Promise<InstanceSelection> => {
  const { project, instance, probeTimeoutMs } = options
  const records = await readInstanceRecords()

  const matches = records.filter((record) => matchesFilters(record, project, instance))

  if (matches.length === 0) {
    throw new CypressInstanceError(
      'NO_INSTANCE',
      `No Cypress instance found${describeFilter(project, instance)}. This command requires Cypress running in open mode. Start Cypress in open mode, open a browser, and try again.`,
    )
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new CypressInstanceError(
      'STALE_INSTANCE',
      `Cypress was previously running${describeFilter(project, instance)}, but is no longer responding. Cypress likely exited uncleanly; start Cypress in open mode, open a browser, and try again.`,
    )
  }

  const { instance: selected, reason } = selectInstance(live, options)

  if (!selected.cdpBrowserWsUrl) {
    throw new CypressInstanceError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running (pid ${selected.pid}, ${selected.projectRoot}), but no test browser is open. Open a browser in Cypress and try again.`,
    )
  }

  return { instance: selected as ReadyInstanceState, reason, candidateCount: live.length }
}
