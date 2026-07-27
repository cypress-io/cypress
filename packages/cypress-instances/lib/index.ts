import path from 'path'

export * from './tap-contract'

export * from './tap-operations'

export type { TapSpecsQuery, TapSpecsQueryVariables, TapRunSpecMutation, TapRunSpecMutationVariables } from './generated/graphql'

export const SCHEMA_VERSION = 1

export const MIN_SCHEMA_VERSION = 1

export const INSTANCES_DIRNAME = 'instances'

const RECORD_EXTENSION = '.json'

export const INSTANCES_ROUTE_PREFIX = '/__cypress/instances/'

export const INSTANCE_ID_HEADER = 'x-cypress-instance-id'

export type InstanceTestingType = 'e2e' | 'component' | null

export interface CypressInstance {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  instanceId: string
  testingType: InstanceTestingType
}

export interface LiveInstanceState extends CypressInstance {
  cdpBrowserWsUrl: string | null
}

export interface ReadyInstanceState extends LiveInstanceState {
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

export const cypressInstancesDir = (cacheRoot: string): string => {
  return path.join(cacheRoot, INSTANCES_DIRNAME)
}

export const recordPath = (cacheRoot: string, pid: number): string => {
  return path.join(cypressInstancesDir(cacheRoot), recordFileName(pid))
}

export const instancesProbePath = (instanceId: string): string => {
  return `${INSTANCES_ROUTE_PREFIX}${instanceId}`
}

const isValidTestingType = (value: any): value is InstanceTestingType => {
  return value === 'e2e' || value === 'component' || value === null
}

export const isCompatibleRecord = (record: any): record is CypressInstance => {
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
