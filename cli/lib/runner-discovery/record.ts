// The record schema, on-disk layout, and probe route are the cross-process
// contract shared with the producer (@packages/server) via @packages/runner-discovery,
// so the CLI reads exactly what the server writes without re-deriving it here.
export {
  INSTANCES_DIRNAME,
  SCHEMA_VERSION,
  MIN_SCHEMA_VERSION,
  isCompatibleRecord,
  recordFileName,
  parseRecordPid,
  runnerDiscoveryProbePath,
  RUNNER_DISCOVERY_ROUTE_PREFIX,
} from '@packages/runner-discovery'

export type {
  RunnerDiscoveryRecord,
  LiveRunnerState,
  ReadyRunnerState,
  RunnerTestingType,
} from '@packages/runner-discovery'

// RunnerDiscoveryError is consumer-side error reporting (how the CLI surfaces a
// missing/stale/browserless runner to the user), not part of the on-disk
// contract, so it lives here rather than in the shared package.
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
