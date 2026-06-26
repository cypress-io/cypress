import path from 'path'

import { RunnerDiscoveryError } from './record'
import type { LiveRunnerState, ReadyRunnerState } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'
import { readRunnerRecords } from './store'

export { RunnerDiscoveryError } from './record'

export type { LiveRunnerState, ReadyRunnerState, RunnerDiscoveryErrorCode, RunnerDiscoveryRecord } from './record'

export { isPidAlive, verifyRunnerRecord } from './liveness'

export { getRunnerDiscoveryDir, pruneDeadDiscoveryRecords, readRunnerRecords } from './store'

export interface FindRunnerOptions {
  instance?: number
  probeTimeoutMs?: number
}

export const findLiveRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<LiveRunnerState> => {
  const records = await readRunnerRecords()
  const resolvedProjectRoot = path.resolve(projectRoot)

  let matches = records.filter((record) => path.resolve(record.projectRoot) === resolvedProjectRoot)

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
