import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { TestingType } from '@packages/types'
import { resolveCypressCacheRoot } from './util/cypress-cache'

const debug = Debug('cypress:server:runner-instances')

// NOTE: This is the producer side of a cross-process on-disk contract. The
// directory name and the `<pid>.json` record filename (see getRecordPath) are
// mirrored in the consumer at cli/lib/runner-instances/store.ts and MUST stay
// in sync — the server writes these records and the CLI reads them.
const INSTANCES_DIRNAME = 'instances'
const SCHEMA_VERSION = 1

export interface RunnerInstance {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  // App-assigned identity for this run, distinct from the OS-assigned pid: a reader
  // probes the server and only trusts it if the echoed instanceId matches, which
  // guards against pid reuse handing the record to an unrelated process.
  instanceId: string
  testingType: TestingType | null
}

export interface LiveRunnerState extends RunnerInstance {
  cdpBrowserWsUrl: string | null
}

export const getRunnerInstancesDir = (): string => {
  return path.join(resolveCypressCacheRoot(), INSTANCES_DIRNAME)
}

const getRecordPath = (pid: number): string => {
  return path.join(getRunnerInstancesDir(), `${pid}.json`)
}

let currentState: LiveRunnerState | null = null

let persistChain: Promise<void> = Promise.resolve()
const persist = (record: RunnerInstance): Promise<void> => {
  const run = async () => {
    const finalPath = getRecordPath(record.pid)
    const tmpPath = `${finalPath}.tmp`

    // Write to a temp file then rename: rename is atomic, so a concurrent reader
    // (e.g. the CLI discovering live runners) always sees either the old record or
    // the fully-written new one, never a partially-written/corrupt JSON file.
    await fs.ensureDir(path.dirname(finalPath))
    await fs.writeJson(tmpPath, record)
    await fs.rename(tmpPath, finalPath)
  }

  const next = persistChain.then(run, run)

  persistChain = next.catch(() => {})

  return next
}

export const runnerInstances = {
  async addInstance ({ projectRoot, serverPort, testingType = null }: { projectRoot: string, serverPort: number, testingType?: TestingType | null }): Promise<void> {
    const record: RunnerInstance = {
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
      debug('wrote runner instance record %o', record)
    } catch (err) {
      debug('failed to write runner instance record: %o', err)
    }
  },

  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('runner instance cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
  },

  getCurrent (): LiveRunnerState | null {
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
        debug('skipping runner instance removal; a newer record is live')

        return
      }

      await fs.remove(getRecordPath(state.pid))
      debug('removed runner instance record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove runner instance record: %o', err)
    }
  },
}

export const _resetForTesting = (): void => {
  currentState = null
  persistChain = Promise.resolve()
}
