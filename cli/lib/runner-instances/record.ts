export {
  INSTANCES_DIRNAME,
  SCHEMA_VERSION,
  MIN_SCHEMA_VERSION,
  isCompatibleRecord,
  recordFileName,
  parseRecordPid,
  runnerInstancesDir,
  runnerInstancesProbePath,
  RUNNER_INSTANCES_ROUTE_PREFIX,
} from '@packages/runner-instances'

export type {
  RunnerInstance,
  LiveRunnerState,
  ReadyRunnerState,
  RunnerTestingType,
} from '@packages/runner-instances'

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
