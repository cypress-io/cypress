import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { Browser, TestingType } from '@packages/types'
import { SCHEMA_VERSION, SESSION_ID_HEADER, cypressSessionsDir, recordPath } from '@packages/cypress-sessions'
import type { CypressSession, LiveSessionState } from '@packages/cypress-sessions'
import { resolveCypressCacheRoot } from './util/cypress-cache'

export type { CypressSession, LiveSessionState } from '@packages/cypress-sessions'

const debug = Debug('cypress:server:cypress-sessions')

export const getSessionsDir = (): string => {
  return cypressSessionsDir(resolveCypressCacheRoot())
}

const getRecordPath = (pid: number): string => {
  return recordPath(resolveCypressCacheRoot(), pid)
}

let currentState: LiveSessionState | null = null

// Set while the record on disk is the one written before the server started. A record
// has the same file name every time this process writes one, so the id is what tells a
// newer pending record from the one a slow caller meant to remove.
let pendingId: string | null = null

let persistChain: Promise<void> = Promise.resolve()
const persist = (record: CypressSession): Promise<void> => {
  const run = async () => {
    const finalPath = getRecordPath(record.pid)
    const tmpPath = `${finalPath}.tmp`

    // Write to a temp file then rename: rename is atomic, so a concurrent reader
    // (e.g. the CLI discovering live sessions) always sees either the old record or
    // the fully-written new one, never a partially-written/corrupt JSON file.
    await fs.ensureDir(path.dirname(finalPath))
    await fs.writeJson(tmpPath, record)
    await fs.rename(tmpPath, finalPath)
  }

  const next = persistChain.then(run, run)

  persistChain = next.catch(() => {})

  return next
}

export const cypressSessions = {
  /**
   * Records that the project could not load, so `cypress tap status` can say why instead of
   * reporting that Cypress cannot be reached. The record names no server; `addSession`
   * replaces it once one starts.
   */
  async addPendingSession ({ projectRoot, testingType = null, loadError }: { projectRoot: string, testingType?: TestingType | null, loadError: string }): Promise<void> {
    if (currentState) {
      return
    }

    const record: CypressSession = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      projectRoot: path.resolve(projectRoot),
      serverPort: 0,
      sessionId: crypto.randomUUID(),
      testingType,
      status: 'starting',
      loadError: { message: loadError },
    }

    pendingId = record.sessionId

    try {
      await persist(record)
      debug('wrote pending cypress sessions record %o', record)
    } catch (err) {
      debug('failed to write pending cypress sessions record: %o', err)
    }
  },

  /**
   * Removes the record written by `addPendingSession`, once the error it reports is gone.
   * A record for a running session is not touched.
   */
  async clearPending (): Promise<void> {
    const pending = pendingId

    if (pending === null || currentState) {
      return
    }

    try {
      await persistChain

      // A session or a newer pending record may have taken over the file while this waited
      if (currentState || pendingId !== pending) {
        debug('skipping clearing the pending cypress sessions record; it was replaced')

        return
      }

      pendingId = null
      await fs.remove(getRecordPath(process.pid))
      debug('cleared pending cypress sessions record')
    } catch (err) {
      debug('failed to clear pending cypress sessions record: %o', err)
    }
  },

  async addSession ({ projectRoot, serverPort, testingType = null }: { projectRoot: string, serverPort: number, testingType?: TestingType | null }): Promise<void> {
    const record: CypressSession = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      projectRoot: path.resolve(projectRoot),
      serverPort,
      sessionId: crypto.randomUUID(),
      testingType,
    }

    // machineId/userId are read fresh from the data context when the probe route
    // answers; the in-memory state only carries the browser attachment.
    currentState = { ...record, cdpBrowserWsUrl: null, browserName: null, browserFamily: null, machineId: null, userId: null }
    pendingId = null

    try {
      await persist(record)
      debug('wrote cypress sessions record %o', record)
    } catch (err) {
      debug('failed to write cypress sessions record: %o', err)
    }
  },

  // The browser Cypress has open, whether or not it speaks CDP: a consumer that
  // cannot drive a non-Chromium browser still needs to know which one is open to
  // say why. Recorded at launch rather than at CDP attach for that reason.
  setBrowser (browser: Pick<Browser, 'displayName' | 'family'> | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, browserName: browser?.displayName ?? null, browserFamily: browser?.family ?? null }
    debug('cypress sessions browser is now %o', browser ? { name: currentState.browserName, family: currentState.browserFamily } : null)
  },

  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('cypress sessions cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
  },

  getCurrent (): LiveSessionState | null {
    return currentState
  },

  hasCurrentSessionIdHeader (headers: Record<string, string | string[] | undefined>): boolean {
    const provided = headers[SESSION_ID_HEADER]
    const current = cypressSessions.getCurrent()?.sessionId

    return Boolean(current) && typeof provided === 'string' && provided === current
  },

  async remove (): Promise<void> {
    const state = currentState
    const pending = pendingId

    currentState = null
    pendingId = null

    if (!state) {
      if (pending !== null) {
        await persistChain

        // A session or a newer pending record written while this waited owns the file now
        if (!currentState && pendingId === null) {
          await fs.remove(getRecordPath(process.pid)).catch((err) => debug('failed to remove pending cypress sessions record: %o', err))
        }
      }

      return
    }

    try {
      await persistChain

      if (currentState) {
        debug('skipping cypress sessions removal; a newer record is live')

        return
      }

      await fs.remove(getRecordPath(state.pid))
      debug('removed cypress sessions record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove cypress sessions record: %o', err)
    }
  },
}

export const _resetForTesting = (): void => {
  currentState = null
  pendingId = null
  persistChain = Promise.resolve()
}
