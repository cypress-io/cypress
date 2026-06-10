import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import pkg from '@packages/root'
import { getCypressCacheRoot } from './util/cypress-cache'

const debug = Debug('cypress:server:runner-discovery')

const RUNNERS_DIRNAME = 'runners'
// v2 added cdpBrowserWsUrl; a reader seeing a lower version treats the record
// as incompatible rather than guessing the missing field.
const SCHEMA_VERSION = 2

export type CdpStatus = 'no_browser' | 'ready'

/**
 * A record published by a running Cypress server so that other processes (the
 * CLI, tooling) can discover it. One file per Cypress process, named by the
 * server PID, dropped at `<cypressCacheRoot>/runners/<pid>.json`.
 *
 * This shape is the cross-process contract; the CLI mirrors it in
 * `cli/lib/runner-discovery.ts`.
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  /** The server process id — also the record's filename. */
  pid: number
  /** Informational only — the CLI version-checks via the tap binding's getSchema. */
  cypressVersion: string
  /** Absolute, resolved project root the server is running against. */
  projectRoot: string
  cdpStatus: CdpStatus
  /**
   * The browser-level CDP WebSocket URL (e.g. `ws://host:port/devtools/browser/<id>`).
   * Non-null only while `cdpStatus` is `ready`. The CLI connects to this
   * directly, so it never has to HTTP-list targets to discover an endpoint.
   * Deliberately the only address in the record: the runner page itself is
   * found by probing targets for the tap binding, since the runner's origin
   * changes on the first cross-origin cy.visit of a test.
   */
  cdpBrowserWsUrl: string | null
}

/**
 * Directory under the Cypress cache root where each running server publishes
 * its discovery record. The server (writer) and CLI (reader) both resolve this
 * through the same CYPRESS_CACHE_FOLDER logic, so they agree by construction.
 */
export const getRunnerDiscoveryDir = (): string => {
  return path.join(getCypressCacheRoot(), RUNNERS_DIRNAME)
}

const getRecordPath = (pid: number): string => {
  return path.join(getRunnerDiscoveryDir(), `${pid}.json`)
}

// Discovery is a best-effort convenience: a failed write must never take down
// a real test run, so the env flag exists purely as a kill switch.
const isDisabled = (): boolean => {
  const flag = process.env.CYPRESS_INTERNAL_RUNNER_DISCOVERY

  return flag === '0' || flag === 'false'
}

// In-memory copy of *this* process's record. Holding it here lets update()
// re-write a record whose file was deleted (e.g. `cypress cache clear` while
// running, or a lost initial write) without threading projectRoot down into
// the browser layer — the browser only knows its own CDP endpoint.
let currentRecord: RunnerDiscoveryRecord | null = null

// Distinguishes concurrent atomic writes so their temp files never collide.
let writeSeq = 0

const persist = async (record: RunnerDiscoveryRecord): Promise<void> => {
  const dir = getRunnerDiscoveryDir()
  const finalPath = getRecordPath(record.pid)
  // Write to a temp sibling then rename so a reader never sees a partial file.
  // The `.tmp` suffix keeps it out of the reader's `<pid>.json` match.
  const tmpPath = `${finalPath}.${writeSeq += 1}.tmp`

  await fs.ensureDir(dir)
  await fs.writeJson(tmpPath, record)
  await fs.move(tmpPath, finalPath, { overwrite: true })
}

export const runnerDiscovery = {
  /**
   * Initial write at server / websocket boot. Seeds the record with no browser
   * attached; the browser CDP lifecycle flips `cdpStatus` later via update().
   */
  async write ({ projectRoot }: { projectRoot: string }): Promise<void> {
    if (isDisabled()) {
      return
    }

    const record: RunnerDiscoveryRecord = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      cypressVersion: pkg.version,
      projectRoot: path.resolve(projectRoot),
      cdpStatus: 'no_browser',
      cdpBrowserWsUrl: null,
    }

    // Set the in-memory truth first; a transient disk failure must not stop a
    // later update() from re-publishing the full record.
    currentRecord = record

    try {
      await persist(record)
      debug('wrote runner discovery record %o', record)
    } catch (err) {
      debug('failed to write runner discovery record: %o', err)
    }
  },

  /**
   * Merge-patch the record as the browser CDP lifecycle moves. Re-writes from
   * the in-memory record, so a missing file (cleared cache, lost initial write)
   * is re-created rather than silently dropped.
   */
  async update (patch: Partial<Pick<RunnerDiscoveryRecord, 'cdpStatus' | 'cdpBrowserWsUrl'>>): Promise<void> {
    if (isDisabled() || !currentRecord) {
      return
    }

    currentRecord = { ...currentRecord, ...patch }

    try {
      await persist(currentRecord)
      debug('updated runner discovery record %o', currentRecord)
    } catch (err) {
      debug('failed to update runner discovery record: %o', err)
    }
  },

  /**
   * Remove the record on clean shutdown. Crashes (SIGKILL, power loss) skip
   * this; the CLI's PID liveness check is what reaps the resulting stale files.
   */
  async remove (): Promise<void> {
    const record = currentRecord

    currentRecord = null

    if (!record) {
      return
    }

    try {
      await fs.remove(getRecordPath(record.pid))
      debug('removed runner discovery record for pid %d', record.pid)
    } catch (err) {
      debug('failed to remove runner discovery record: %o', err)
    }
  },
}

// Test-only: reset the in-memory singleton between cases.
export const _resetForTesting = (): void => {
  currentRecord = null
  writeSeq = 0
}
