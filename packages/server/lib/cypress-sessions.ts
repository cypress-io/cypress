import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { Browser, TestingType } from '@packages/types'
import { SCHEMA_VERSION, cypressSessionsDir, recordPath } from '@packages/cypress-sessions'
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

  async remove (): Promise<void> {
    const state = currentState

    currentState = null

    if (!state) {
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
  persistChain = Promise.resolve()
}
