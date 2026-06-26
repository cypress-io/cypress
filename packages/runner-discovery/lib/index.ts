import path from 'path'

export const SCHEMA_VERSION = 1

export const MIN_SCHEMA_VERSION = 1

// Directory under the Cypress cache root that holds the per-instance records.
export const INSTANCES_DIRNAME = 'instances'

const RECORD_EXTENSION = '.json'

export const RUNNER_DISCOVERY_ROUTE_PREFIX = '/__cypress/runner-discovery/'

export type RunnerTestingType = 'e2e' | 'component' | null

export interface RunnerDiscoveryRecord {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  instanceId: string
  testingType: RunnerTestingType
}

export interface LiveRunnerState extends RunnerDiscoveryRecord {
  cdpBrowserWsUrl: string | null
}

export interface ReadyRunnerState extends LiveRunnerState {
  cdpBrowserWsUrl: string
}

// Records are named `<pid>.json`; the pid in the filename is the lookup key the
// reader uses before reading the file.
export const recordFileName = (pid: number): string => {
  return `${pid}${RECORD_EXTENSION}`
}

export const parseRecordPid = (entry: string): number | null => {
  if (path.extname(entry) !== RECORD_EXTENSION) {
    return null
  }

  const pid = Number(path.basename(entry, RECORD_EXTENSION))

  return Number.isInteger(pid) ? pid : null
}

export const runnerDiscoveryProbePath = (instanceId: string): string => {
  return `${RUNNER_DISCOVERY_ROUTE_PREFIX}${instanceId}`
}

const isValidTestingType = (value: any): value is RunnerTestingType => {
  return value === 'e2e' || value === 'component' || value === null
}

export const isCompatibleRecord = (record: any): record is RunnerDiscoveryRecord => {
  return Boolean(record)
    && typeof record.schemaVersion === 'number'
    && record.schemaVersion >= MIN_SCHEMA_VERSION
    && typeof record.pid === 'number'
    && typeof record.projectRoot === 'string'
    && Number.isInteger(record.serverPort)
    && typeof record.instanceId === 'string'
    && record.instanceId.length > 0
    && isValidTestingType(record.testingType)
}
