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
  /** Optional pid filter; omitted lists every matching instance. */
  instance?: number
  probeTimeoutMs?: number
}

const matchesProject = (record: CypressInstance, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

// An undefined instance does not constrain, so an absent `--instance` lists
// every pid.
const matchesInstance = (record: CypressInstance, instance: number | undefined): boolean => {
  return instance === undefined || record.pid === instance
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
 * specific pid. "No instances" is a valid, empty list, never an error — this
 * backs the `instances` command.
 */
export const listLiveInstances = async (options: ListInstanceOptions = {}): Promise<LiveInstanceState[]> => {
  const records = await readInstanceRecords()

  const matches = records.filter((record) => matchesInstance(record, options.instance))

  return probeMatches(matches, options.probeTimeoutMs)
}

export type InstanceSelectionReason = 'explicit' | 'only' | 'cwd-match' | 'arbitrary'

export interface InstanceSelection {
  instance: ReadyInstanceState
  reason: InstanceSelectionReason
  candidateCount: number
}

export interface ResolveInstanceOptions {
  instance?: number
  cwd: string
  probeTimeoutMs?: number
}

// Phrase the filter that came up empty so the discovery errors name what the
// user actually asked for (a pid, or nothing in particular).
const describeFilter = (instance: number | undefined): string => {
  if (instance !== undefined) {
    return ` with pid ${instance}`
  }

  return ''
}

const lowestPid = (instances: LiveInstanceState[]): LiveInstanceState => {
  return [...instances].sort((a, b) => a.pid - b.pid)[0]
}

// Browser readiness is not a selection criterion — the caller requires it of
// whatever is chosen.
const selectInstance = (live: LiveInstanceState[], options: ResolveInstanceOptions): { instance: LiveInstanceState, reason: InstanceSelectionReason } => {
  if (live.length === 1) {
    const filtered = options.instance !== undefined

    return { instance: live[0], reason: filtered ? 'explicit' : 'only' }
  }

  const cwdMatches = live.filter((record) => matchesProject(record, options.cwd))

  if (cwdMatches.length > 0) {
    return { instance: lowestPid(cwdMatches), reason: 'cwd-match' }
  }

  return { instance: lowestPid(live), reason: 'arbitrary' }
}

export const resolveInstance = async (options: ResolveInstanceOptions): Promise<InstanceSelection> => {
  const { instance, probeTimeoutMs } = options
  const records = await readInstanceRecords()

  const matches = records.filter((record) => matchesInstance(record, instance))

  if (matches.length === 0) {
    throw new CypressInstanceError(
      'NO_INSTANCE',
      `No Cypress instance found${describeFilter(instance)}. This command requires Cypress running in open mode. Start Cypress in open mode, open a browser, and try again.`,
    )
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new CypressInstanceError(
      'STALE_INSTANCE',
      `Cypress was previously running${describeFilter(instance)}, but is no longer responding. Cypress likely exited uncleanly; start Cypress in open mode, open a browser, and try again.`,
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
