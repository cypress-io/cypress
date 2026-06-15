const MIN_SCHEMA_VERSION = 1

/**
 * Mirror of `@packages/server`'s `RunnerDiscoveryRecord`. The `cypress` CLI is
 * published separately and cannot import server code at runtime, so the shape
 * is duplicated here; it is the cross-process contract.
 *
 * The record holds only identity fields, all fixed for as long as it is
 * published — anything that changes while Cypress runs (the browser CDP
 * state) arrives in the liveness probe response instead, never from disk
 * (see {@link LiveRunnerState}).
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  /** Informational/disambiguation only — pids are recycled by the OS, so
   * liveness is established by the instanceId probe, never by this pid. */
  pid: number
  projectRoot: string
  /** Port of the runner's HTTP server, where the discovery probe route lives. */
  serverPort: number
  /** Random per-process token echoed by the runner's probe route. */
  instanceId: string
}

/**
 * A verified-live runner: its discovery record plus the live browser CDP
 * state carried by the probe response. The probe is the sole source of
 * `cdpBrowserWsUrl` — only the runner's own memory knows whether (and where)
 * a browser is attached right now.
 */
export interface LiveRunnerState extends RunnerDiscoveryRecord {
  /** Browser-level CDP WebSocket URL; null while no browser is attached. */
  cdpBrowserWsUrl: string | null
}

/**
 * A live runner narrowed to an attached browser — cdpBrowserWsUrl is non-null.
 */
export interface ReadyRunnerState extends LiveRunnerState {
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
