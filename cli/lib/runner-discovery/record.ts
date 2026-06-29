export {
  INSTANCES_DIRNAME,
  SCHEMA_VERSION,
  MIN_SCHEMA_VERSION,
  isCompatibleRecord,
  recordFileName,
  parseRecordPid,
  runnerDiscoveryDir,
  runnerDiscoveryProbePath,
  RUNNER_DISCOVERY_ROUTE_PREFIX,
} from '@packages/runner-discovery'

export type {
  RunnerDiscoveryRecord,
  LiveRunnerState,
  ReadyRunnerState,
  RunnerTestingType,
} from '@packages/runner-discovery'

export type RunnerDiscoveryErrorCode =
  | 'NO_DISCOVERY_FILE'
  | 'STALE_DISCOVERY_FILE'
  | 'NO_BROWSER_ATTACHED'

export class RunnerDiscoveryError extends Error {
  code: RunnerDiscoveryErrorCode

  constructor (code: RunnerDiscoveryErrorCode, message: string) {
    super(message)
    this.name = 'RunnerDiscoveryError'
    this.code = code
  }
}
