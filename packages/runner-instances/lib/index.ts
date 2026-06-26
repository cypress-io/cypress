import path from 'path'

// The cross-process contract for runner instances, shared by the producer
// (@packages/server, which writes the records and serves the liveness probe)
// and the consumer (the `cypress` CLI, which reads the records and probes).
//
// This module is deliberately dependency-free pure logic — schema, on-disk
// layout, and probe route only — so the CLI can bundle it without taking on any
// new runtime dependency, while both sides agree on the contract by construction
// rather than by hand-mirrored constants and interfaces.

// Bump SCHEMA_VERSION when the record shape changes incompatibly. MIN_SCHEMA_VERSION
// is the oldest version a reader will still trust; a reader skips anything older.
export const SCHEMA_VERSION = 1

export const MIN_SCHEMA_VERSION = 1

// Directory under the Cypress cache root that holds the per-instance records.
export const INSTANCES_DIRNAME = 'instances'

const RECORD_EXTENSION = '.json'

// Route the server exposes (open mode only) for a reader to probe liveness. The
// reader hits `${PREFIX}<instanceId>` and trusts the response only if the echoed
// instanceId matches the record, which guards against pid/port reuse.
export const RUNNER_INSTANCES_ROUTE_PREFIX = '/__cypress/runner-instances/'

export type RunnerTestingType = 'e2e' | 'component' | null

export interface RunnerInstance {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  // App-assigned identity for this run, distinct from the OS-assigned pid: a reader
  // probes the server and only trusts it if the echoed instanceId matches, which
  // guards against pid reuse handing the record to an unrelated process.
  instanceId: string
  testingType: RunnerTestingType
}

// The probe response: the persisted record plus the live CDP endpoint, which is
// never written to disk (it changes as browsers open/close) and only travels in
// the probe response.
export interface LiveRunnerState extends RunnerInstance {
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
