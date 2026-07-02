import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { TestingType } from '@packages/types'
import { SCHEMA_VERSION, cypressInstancesDir, recordPath } from '@packages/cypress-instances'
import type { CypressInstance, LiveInstanceState } from '@packages/cypress-instances'
import { resolveCypressCacheRoot } from './util/cypress-cache'

export type { CypressInstance, LiveInstanceState } from '@packages/cypress-instances'

const debug = Debug('cypress:server:cypress-instances')

export const getInstancesDir = (): string => {
  return cypressInstancesDir(resolveCypressCacheRoot())
}

const getRecordPath = (pid: number): string => {
  return recordPath(resolveCypressCacheRoot(), pid)
}

let currentState: LiveInstanceState | null = null

let persistChain: Promise<void> = Promise.resolve()
const persist = (record: CypressInstance): Promise<void> => {
  const run = async () => {
    const finalPath = getRecordPath(record.pid)
    const tmpPath = `${finalPath}.tmp`

    // Write to a temp file then rename: rename is atomic, so a concurrent reader
    // (e.g. the CLI discovering live instances) always sees either the old record or
    // the fully-written new one, never a partially-written/corrupt JSON file.
    await fs.ensureDir(path.dirname(finalPath))
    await fs.writeJson(tmpPath, record)
    await fs.rename(tmpPath, finalPath)
  }

  const next = persistChain.then(run, run)

  persistChain = next.catch(() => {})

  return next
}

export const cypressInstances = {
  async addInstance ({ projectRoot, serverPort, testingType = null }: { projectRoot: string, serverPort: number, testingType?: TestingType | null }): Promise<void> {
    const record: CypressInstance = {
      schemaVersion: SCHEMA_VERSION,
      pid: process.pid,
      projectRoot: path.resolve(projectRoot),
      serverPort,
      instanceId: crypto.randomUUID(),
      testingType,
    }

    currentState = { ...record, cdpBrowserWsUrl: null }

    try {
      await persist(record)
      debug('wrote cypress instances record %o', record)
    } catch (err) {
      debug('failed to write cypress instances record: %o', err)
    }
  },

  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('cypress instances cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
  },

  getCurrent (): LiveInstanceState | null {
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
        debug('skipping cypress instances removal; a newer record is live')

        return
      }

      await fs.remove(getRecordPath(state.pid))
      debug('removed cypress instances record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove cypress instances record: %o', err)
    }
  },
}

export const _resetForTesting = (): void => {
  currentState = null
  persistChain = Promise.resolve()
}
