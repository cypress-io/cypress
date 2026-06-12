import path from 'path'

import { RunnerDiscoveryError } from './record'
import type { LiveRunnerState, ReadyRunnerState, RunnerDiscoveryRecord } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'
import { readRunnerRecords } from './store'

export { RunnerDiscoveryError } from './record'

export type { LiveRunnerState, ReadyRunnerState, RunnerDiscoveryErrorCode, RunnerDiscoveryRecord } from './record'

export { isPidAlive, verifyRunnerRecord } from './liveness'

export { getRunnerDiscoveryDir, pruneDeadDiscoveryRecords, readRunnerRecords } from './store'

export interface FindRunnerOptions {
  /**
   * Target a specific instance by server PID. Disambiguates when multiple
   * Cypress instances are running against the same project root.
   */
  instance?: number
  /** Per-record liveness probe timeout. */
  probeTimeoutMs?: number
}

const matchesProject = (record: RunnerDiscoveryRecord, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

/**
 * Find the first verified-live Cypress runner for a project. A record only
 * counts as live when its writer echoes the record's instanceId from the
 * recorded server port — see {@link verifyRunnerRecord}. Resolves to the
 * record merged with the runner's live browser CDP state, which the probe
 * response carries.
 *
 * @throws {RunnerDiscoveryError} `NO_DISCOVERY_FILE` when no record matches the project
 * @throws {RunnerDiscoveryError} `STALE_DISCOVERY_FILE` when records match but none verify as alive
 */
export const findLiveRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<LiveRunnerState> => {
  const records = await readRunnerRecords()

  let matches = records.filter((record) => matchesProject(record, projectRoot))

  if (options.instance !== undefined) {
    matches = matches.filter((record) => record.pid === options.instance)
  }

  if (matches.length === 0) {
    throw new RunnerDiscoveryError(
      'NO_DISCOVERY_FILE',
      `No running Cypress was found for ${projectRoot}. Start Cypress, then try again.`,
    )
  }

  for (const record of matches) {
    // Dead pid means the writer is certainly gone — skip the probe.
    if (!isPidAlive(record.pid)) {
      continue
    }

    const live = await verifyRunnerRecord(record, options.probeTimeoutMs)

    if (live) {
      return live
    }
  }

  throw new RunnerDiscoveryError(
    'STALE_DISCOVERY_FILE',
    `A Cypress discovery record exists for ${projectRoot}, but no running Cypress answered for it. Cypress likely exited uncleanly; restart it and try again.`,
  )
}

/**
 * Like {@link findLiveRunner}, but requires a browser with a live CDP
 * connection and narrows the return type so callers never defend against a
 * null cdpBrowserWsUrl.
 *
 * @throws {RunnerDiscoveryError} `NO_BROWSER_ATTACHED` when the runner is live but no browser is connected
 */
export const findReadyRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<ReadyRunnerState> => {
  const runner = await findLiveRunner(projectRoot, options)

  if (!runner.cdpBrowserWsUrl) {
    throw new RunnerDiscoveryError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running for ${projectRoot}, but no browser is attached yet. Open a browser in Cypress, then try again.`,
    )
  }

  return runner as ReadyRunnerState
}
