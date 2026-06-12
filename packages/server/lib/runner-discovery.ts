import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import pkg from '@packages/root'
import { resolveCypressCacheRoot } from './util/cypress-cache'

const debug = Debug('cypress:server:runner-discovery')

const RUNNERS_DIRNAME = 'runners'
// v2 added cdpBrowserWsUrl; v3 added serverPort + instanceId so readers verify
// liveness by probing the server (`GET /__cypress/runner-discovery/<instanceId>`)
// instead of trusting the pid, which the OS can recycle. A reader seeing a
// lower version treats the record as incompatible rather than guessing.
const SCHEMA_VERSION = 3

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
  /** The server process id — also the record's filename. Informational only:
   * PIDs are recycled by the OS, so readers verify liveness via the
   * instanceId probe, never by signalling this pid. */
  pid: number
  /** Informational only — the CLI version-checks via the tap binding's getSchema. */
  cypressVersion: string
  /** Absolute, resolved project root the server is running against. */
  projectRoot: string
  /** Port of this Cypress server's HTTP server, where the discovery probe
   * route lives. Bound before the record is written, so a record on disk
   * always names a connectable port for as long as its writer is alive. */
  serverPort: number
  /**
   * Random per-process token. The server echoes it from
   * `GET /__cypress/runner-discovery/<instanceId>`, so a reader that gets a
   * matching echo has proof the record's writer is alive — immune to both pid
   * and port re-use after a crash.
   */
  instanceId: string
  cdpStatus: CdpStatus
  /**
   * The browser-level CDP WebSocket URL (e.g. `ws://host:port/devtools/browser/<id>`).
   * Non-null only while `cdpStatus` is `ready`. The CLI connects to this
   * directly, so it never has to HTTP-list targets to discover an endpoint.
   * Deliberately the only browser address in the record: the runner page
   * itself is found by probing targets for the tap binding, since the
   * runner's origin changes on the first cross-origin cy.visit of a test.
   */
  cdpBrowserWsUrl: string | null
}

/**
 * Directory under the Cypress cache root where each running server publishes
 * its discovery record. The server (writer) and CLI (reader) both resolve this
 * through the same CYPRESS_CACHE_FOLDER logic, so they agree by construction.
 */
export const getRunnerDiscoveryDir = (): string => {
  return path.join(resolveCypressCacheRoot(), RUNNERS_DIRNAME)
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
// the browser layer — the browser only knows its own CDP endpoint. It also
// backs the discovery probe route, which must answer from live state, not disk.
let currentRecord: RunnerDiscoveryRecord | null = null

// Distinguishes concurrent atomic writes so their temp files never collide.
let writeSeq = 0

// All persists run through this chain so writes never interleave and remove()
// can wait out an in-flight write before deleting — otherwise a persist racing
// remove() would re-create the record file after close, leaving a phantom
// record with a live pid for as long as the process stays up (`cypress open`).
let persistChain: Promise<void> = Promise.resolve()

const persist = (record: RunnerDiscoveryRecord): Promise<void> => {
  const run = async () => {
    const dir = getRunnerDiscoveryDir()
    const finalPath = getRecordPath(record.pid)
    // Write to a temp sibling then rename so a reader never sees a partial
    // file. Plain rename (not fs-extra move, which removes-then-renames and
    // opens an ENOENT window) — same-directory rename replaces atomically.
    // The `.tmp` suffix keeps it out of the reader's `<pid>.json` match.
    const tmpPath = `${finalPath}.${writeSeq += 1}.tmp`

    await fs.ensureDir(dir)
    await fs.writeJson(tmpPath, record)
    await fs.rename(tmpPath, finalPath)
  }

  // Run regardless of whether the previous persist failed; callers handle
  // this persist's own failure, and the stored chain never stays rejected.
  const next = persistChain.then(run, run)

  persistChain = next.catch(() => {})

  return next
}

export const runnerDiscovery = {
  /**
   * Initial write at server boot, after the HTTP server's port is bound (the
   * record must never advertise a port that isn't accepting connections yet).
   * Seeds the record with no browser attached; the browser CDP lifecycle flips
   * `cdpStatus` later via update().
   */
  async write ({ projectRoot, serverPort }: { projectRoot: string, serverPort: number }): Promise<void> {
    if (isDisabled()) {
      return
    }

    const record: RunnerDiscoveryRecord = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      cypressVersion: pkg.version,
      projectRoot: path.resolve(projectRoot),
      serverPort,
      instanceId: crypto.randomUUID(),
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
   * The live record for this process, or null when none is published. Backs
   * the `/__cypress/runner-discovery/:instanceId` probe route — readers treat
   * a matching instanceId echo as the proof of liveness.
   */
  getCurrent (): RunnerDiscoveryRecord | null {
    return currentRecord
  },

  /**
   * Remove the record on clean shutdown. Crashes (SIGKILL, power loss) skip
   * this; the CLI's liveness probe is what flags the resulting stale files,
   * and `cypress cache prune` reaps them.
   */
  async remove (): Promise<void> {
    const record = currentRecord

    currentRecord = null

    if (!record) {
      return
    }

    try {
      // Wait out any in-flight persist so it can't re-create the file after
      // we delete it. New persists can't start: currentRecord is now null.
      await persistChain
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
  persistChain = Promise.resolve()
}
