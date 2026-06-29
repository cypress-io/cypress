import path from 'path'

export const SCHEMA_VERSION = 1

export const MIN_SCHEMA_VERSION = 1

export const INSTANCES_DIRNAME = 'instances'

const RECORD_EXTENSION = '.json'

export const RUNNER_INSTANCES_ROUTE_PREFIX = '/__cypress/runner-instances/'

export type RunnerTestingType = 'e2e' | 'component' | null

export interface RunnerInstance {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  instanceId: string
  testingType: RunnerTestingType
}

export interface LiveRunnerState extends RunnerInstance {
  cdpBrowserWsUrl: string | null
}

export interface ReadyRunnerState extends LiveRunnerState {
  cdpBrowserWsUrl: string
}

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

export const runnerInstancesDir = (cacheRoot: string): string => {
  return path.join(cacheRoot, INSTANCES_DIRNAME)
}

export const recordPath = (cacheRoot: string, pid: number): string => {
  return path.join(runnerInstancesDir(cacheRoot), recordFileName(pid))
}

export const runnerInstancesProbePath = (instanceId: string): string => {
  return `${RUNNER_INSTANCES_ROUTE_PREFIX}${instanceId}`
}

const isValidTestingType = (value: any): value is RunnerTestingType => {
  return value === 'e2e' || value === 'component' || value === null
}

export const isCompatibleRecord = (record: any): record is RunnerInstance => {
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
