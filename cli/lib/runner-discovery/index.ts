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
      `No Cypress instance found for ${projectRoot}. This command requires Cypress running in open mode. Start Cypress in open mode, open a browser, and try again.`,
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
    `Cypress was previously running for ${projectRoot}, but is no longer responding. Cypress likely exited uncleanly; start Cypress in open mode, open a browser, and try again.`,
  )
}

export const findReadyRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<ReadyRunnerState> => {
  const runner = await findLiveRunner(projectRoot, options)

  if (!runner.cdpBrowserWsUrl) {
    throw new RunnerDiscoveryError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running for ${projectRoot}, but no test browser is open. Open a browser in Cypress and try again.`,
    )
  }

  return runner as ReadyRunnerState
}
