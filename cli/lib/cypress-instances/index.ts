import path from 'path'

import { CypressInstanceError } from './record'
import type { LiveInstanceState, ReadyInstanceState } from './record'
import { isPidAlive, verifyInstanceRecord } from './liveness'
import { readInstanceRecords } from './store'

export { CypressInstanceError, INSTANCES_DIRNAME } from './record'

export type { LiveInstanceState, ReadyInstanceState, CypressInstanceErrorCode, CypressInstance } from './record'

export { isPidAlive, verifyInstanceRecord } from './liveness'

export { getInstancesDir, pruneDeadInstanceRecords, readInstanceRecords } from './store'

export interface FindInstanceOptions {
  instance?: number
  probeTimeoutMs?: number
}

export const findLiveInstance = async (projectRoot: string, options: FindInstanceOptions = {}): Promise<LiveInstanceState> => {
  const records = await readInstanceRecords()
  const resolvedProjectRoot = path.resolve(projectRoot)

  let matches = records.filter((record) => path.resolve(record.projectRoot) === resolvedProjectRoot)

  if (options.instance !== undefined) {
    matches = matches.filter((record) => record.pid === options.instance)
  }

  if (matches.length === 0) {
    throw new CypressInstanceError(
      'NO_INSTANCE',
      `No Cypress instance found for ${projectRoot}. This command requires Cypress running in open mode. Start Cypress in open mode, open a browser, and try again.`,
    )
  }

  for (const record of matches) {
    if (!isPidAlive(record.pid)) {
      continue
    }

    const live = await verifyInstanceRecord(record, options.probeTimeoutMs)

    if (live) {
      return live
    }
  }

  throw new CypressInstanceError(
    'STALE_INSTANCE',
    `Cypress was previously running for ${projectRoot}, but is no longer responding. Please ensure Cypress has completely exited; start Cypress again in open mode, open a browser, and try again.`,
  )
}

export const findReadyInstance = async (projectRoot: string, options: FindInstanceOptions = {}): Promise<ReadyInstanceState> => {
  const instance = await findLiveInstance(projectRoot, options)

  if (!instance.cdpBrowserWsUrl) {
    throw new CypressInstanceError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running for ${projectRoot}, but no test browser is open. Open a browser in Cypress and try again.`,
    )
  }

  return instance as ReadyInstanceState
}
