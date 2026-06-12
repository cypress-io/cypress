// Oldest record schema this reader can verify: v3 introduced serverPort and
// instanceId, which the liveness probe depends on.
const MIN_SCHEMA_VERSION = 3

/**
 * Mirror of `@packages/server`'s `RunnerDiscoveryRecord`. The `cypress` CLI is
 * published separately and cannot import server code at runtime, so the shape
 * is duplicated here; it is the cross-process contract.
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  /** Informational/disambiguation only — pids are recycled by the OS, so
   * liveness is established by the instanceId probe, never by this pid. */
  pid: number
  cypressVersion: string
  projectRoot: string
  /** Port of the runner's HTTP server, where the discovery probe route lives. */
  serverPort: number
  /** Random per-process token echoed by the runner's probe route. */
  instanceId: string
  cdpStatus: 'no_browser' | 'ready'
  /** Browser-level CDP WebSocket URL; non-null only while `cdpStatus` is `ready`. */
  cdpBrowserWsUrl: string | null
}

/**
 * A record narrowed to a live CDP connection — cdpBrowserWsUrl is non-null.
 */
export interface ReadyRunnerDiscoveryRecord extends RunnerDiscoveryRecord {
  cdpStatus: 'ready'
  cdpBrowserWsUrl: string
}

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

// A record this reader can probe. Anything else — older schema, hand-edited
// file, future shape — is unusable, since liveness can't be established.
export const isCompatibleRecord = (record: any): record is RunnerDiscoveryRecord => {
  return Boolean(record)
    && typeof record.schemaVersion === 'number'
    && record.schemaVersion >= MIN_SCHEMA_VERSION
    && typeof record.pid === 'number'
    && typeof record.projectRoot === 'string'
    && Number.isInteger(record.serverPort)
    && typeof record.instanceId === 'string'
    && record.instanceId.length > 0
}
