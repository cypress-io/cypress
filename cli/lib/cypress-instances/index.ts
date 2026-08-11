import path from 'path'

import { TapError } from './record'
import type { LiveInstanceState, ReadyInstanceState, CypressInstance } from './record'
import { isPidAlive, verifyInstanceRecord } from './liveness'
import { readLiveInstances } from './store'

export { TapError, isTapError, INSTANCES_DIRNAME } from './record'

export type { LiveInstanceState, ReadyInstanceState, CypressInstance } from './record'

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

export const listLiveInstances = async (options: ListInstanceOptions = {}): Promise<LiveInstanceState[]> => {
  const records = await readLiveInstances()

  const matches = records.filter((record) => matchesInstance(record, options.instance))

  return probeMatches(matches, options.probeTimeoutMs)
}

export type InstanceSelectionReason = 'explicit' | 'only' | 'cwd-match' | 'arbitrary'

export interface InstanceSelection {
  instance: ReadyInstanceState
  reason: InstanceSelectionReason
  candidateCount: number
}

// Like InstanceSelection, but the chosen instance may have no browser attached yet.
export interface LiveInstanceSelection {
  instance: LiveInstanceState
  reason: InstanceSelectionReason
  candidateCount: number
}

export interface ResolveInstanceOptions {
  instance?: number
  cwd: string
  probeTimeoutMs?: number
}

// The specifics an instance failure carries: which pid was asked for, if any. The
// condition and the remedy come from the error's registry entry, so this adds only
// what that entry cannot know.
const describeFilter = (instance: number | undefined): string | undefined => {
  return instance === undefined ? undefined : `Looked for pid ${instance}.`
}

const lowestPid = <T extends LiveInstanceState>(instances: T[]): T => {
  return [...instances].sort((a, b) => a.pid - b.pid)[0]
}

const selectInstance = <T extends LiveInstanceState>(candidates: T[], options: ResolveInstanceOptions): { instance: T, reason: InstanceSelectionReason } => {
  if (candidates.length === 1) {
    const filtered = options.instance !== undefined

    return { instance: candidates[0], reason: filtered ? 'explicit' : 'only' }
  }

  const cwdMatches = candidates.filter((record) => matchesProject(record, options.cwd))

  if (cwdMatches.length > 0) {
    return { instance: lowestPid(cwdMatches), reason: 'cwd-match' }
  }

  return { instance: lowestPid(candidates), reason: 'arbitrary' }
}

// Reads, filters by pid, and probes for liveness. Throws NO_INSTANCE when
// nothing matches and STALE_INSTANCE when matches exist but none responds.
const liveMatches = async (options: ResolveInstanceOptions): Promise<LiveInstanceState[]> => {
  const { instance, probeTimeoutMs } = options
  const records = await readLiveInstances()

  const matches = records.filter((record) => matchesInstance(record, instance))

  if (matches.length === 0) {
    throw new TapError('NO_INSTANCE', { detail: describeFilter(instance) })
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new TapError('STALE_INSTANCE', { detail: describeFilter(instance) })
  }

  return live
}

// Resolves a live instance without requiring a browser; `status` reports
// instances that have no browser attached yet.
export const resolveLiveInstance = async (options: ResolveInstanceOptions): Promise<LiveInstanceSelection> => {
  const live = await liveMatches(options)

  const { instance, reason } = selectInstance(live, options)

  return { instance, reason, candidateCount: live.length }
}

// Adds the browser-readiness requirement to resolveLiveInstance: the instance
// it returns is guaranteed to have a browser attached. Gate on the browser
// before selecting so a browserless instance never shadows a ready one that
// could serve the command.
export const resolveInstance = async (options: ResolveInstanceOptions): Promise<InstanceSelection> => {
  const live = await liveMatches(options)

  const ready = live.filter((record): record is ReadyInstanceState => record.cdpBrowserWsUrl !== null)

  if (ready.length === 0) {
    const detail = live.length === 1
      ? `The instance is pid ${live[0].pid}, at ${live[0].projectRoot}.`
      : describeFilter(options.instance)

    throw new TapError('NO_BROWSER_ATTACHED', { detail })
  }

  const { instance: selected, reason } = selectInstance(ready, options)

  return { instance: selected, reason, candidateCount: ready.length }
}
