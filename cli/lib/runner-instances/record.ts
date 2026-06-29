export {
  INSTANCES_DIRNAME,
  isCompatibleRecord,
  parseRecordPid,
  runnerInstancesDir,
  runnerInstancesProbePath,
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
