import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import { resolveCypressCacheRoot } from './util/cypress-cache'

const debug = Debug('cypress:server:runner-discovery')

const RUNNERS_DIRNAME = 'runners'
const SCHEMA_VERSION = 1

/**
 * A record published by a running Cypress server so that other processes (the
 * CLI, tooling) can discover it. One file per Cypress process, named by the
 * server PID, dropped at `<cypressCacheRoot>/runners/<pid>.json`.
 *
 * Every field is fixed for the life of the process, so the file is written
 * once at boot and removed at shutdown. (see {@link LiveRunnerState}).
 *
 * This shape is the cross-process contract; the CLI mirrors it in
 * `cli/lib/runner-discovery/record.ts`.
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  /** The server process id — also the record's filename. Informational only:
   * PIDs are recycled by the OS, so readers verify liveness via the
   * instanceId probe, never by signalling this pid. */
  pid: number
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
}

/**
 * What the discovery probe route returns: the published record plus the live
 * browser CDP state. The CDP endpoint is deliberately memory-only — a disk
 * copy would go stale the moment the browser attaches or exits, while a
 * reader holding this object has just proven the runner is alive, so the
 * answer is fresh by construction.
 */
export interface LiveRunnerState extends RunnerDiscoveryRecord {
  /**
   * The browser-level CDP WebSocket URL (e.g. `ws://host:port/devtools/browser/<id>`);
   * null while no browser is attached. The CLI connects to this directly, so
   * it never has to HTTP-list targets to discover an endpoint. Deliberately
   * the only browser address exposed: the runner page itself is found by
   * probing targets for the tap binding, since the runner's origin changes on
   * the first cross-origin cy.visit of a test.
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

// In-memory state for *this* process. Backs the discovery probe route — which
// must answer from live state, not disk — and is the only home of the CDP
// endpoint, which is never persisted.
let currentState: LiveRunnerState | null = null

// Persists are chained so remove() can wait out an in-flight write before
// deleting — otherwise a write racing remove() would re-create the record
// file after close, leaving a phantom record with a live pid for as long as
// the process stays up (`cypress open`).
let persistChain: Promise<void> = Promise.resolve()

const persist = (record: RunnerDiscoveryRecord): Promise<void> => {
  const run = async () => {
    const dir = getRunnerDiscoveryDir()
    const finalPath = getRecordPath(record.pid)
    // Write to a temp sibling then rename so a reader never sees a partial
    // file. Plain rename (not fs-extra move, which removes-then-renames and
    // opens an ENOENT window) — same-directory rename replaces atomically.
    // The `.tmp` suffix keeps it out of the reader's `<pid>.json` match, and
    // the pid in the path keeps concurrent processes' temp files apart.
    const tmpPath = `${finalPath}.tmp`

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
   * The record's one disk write, at server boot, after the HTTP server's port
   * is bound (the record must never advertise a port that isn't accepting
   * connections yet). Every persisted field is fixed for as long as the
   * record is published, so nothing ever re-writes the file.
   */
  async write ({ projectRoot, serverPort }: { projectRoot: string, serverPort: number }): Promise<void> {
    if (isDisabled()) {
      return
    }

    const record: RunnerDiscoveryRecord = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      projectRoot: path.resolve(projectRoot),
      serverPort,
      instanceId: crypto.randomUUID(),
    }

    currentState = { ...record, cdpBrowserWsUrl: null }

    try {
      await persist(record)
      debug('wrote runner discovery record %o', record)
    } catch (err) {
      debug('failed to write runner discovery record: %o', err)
    }
  },

  /**
   * Track where the browser's CDP endpoint currently lives (null when the
   * browser goes away). Memory-only: readers receive it in the probe
   * response, so the on-disk record never needs a re-write as browsers come
   * and go.
   */
  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('runner discovery cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
  },

  /**
   * The live state for this process, or null when none is published. Backs
   * the `/__cypress/runner-discovery/:instanceId` probe route — readers treat
   * a matching instanceId echo as the proof of liveness, and take the browser
   * CDP state from the same response.
   */
  getCurrent (): LiveRunnerState | null {
    return currentState
  },

  /**
   * Remove the record on clean shutdown. Crashes (SIGKILL, power loss) skip
   * this; the CLI's liveness probe is what flags the resulting stale files,
   * and `cypress cache prune` reaps them.
   */
  async remove (): Promise<void> {
    const state = currentState

    currentState = null

    if (!state) {
      return
    }

    try {
      // Wait out any in-flight persist so it can't re-create the file after
      // we delete it. New persists can't start: currentState is now null.
      await persistChain
      await fs.remove(getRecordPath(state.pid))
      debug('removed runner discovery record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove runner discovery record: %o', err)
    }
  },
}

// Test-only: reset the in-memory singleton between cases.
export const _resetForTesting = (): void => {
  currentState = null
  persistChain = Promise.resolve()
}
