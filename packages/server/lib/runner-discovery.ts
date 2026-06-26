import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { TestingType } from '@packages/types'
import { resolveCypressCacheRoot } from './util/cypress-cache'

const debug = Debug('cypress:server:runner-discovery')

const RUNNERS_DIRNAME = 'runners'
const SCHEMA_VERSION = 1

export interface RunnerDiscoveryRecord {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  instanceId: string
  testingType: TestingType | null
}

export interface LiveRunnerState extends RunnerDiscoveryRecord {
  cdpBrowserWsUrl: string | null
}

export const getRunnerDiscoveryDir = (): string => {
  return path.join(resolveCypressCacheRoot(), RUNNERS_DIRNAME)
}

const getRecordPath = (pid: number): string => {
  return path.join(getRunnerDiscoveryDir(), `${pid}.json`)
}

const isDisabled = (): boolean => {
  const flag = process.env.CYPRESS_INTERNAL_RUNNER_DISCOVERY

  return flag === '0' || flag === 'false'
}

let currentState: LiveRunnerState | null = null

let persistChain: Promise<void> = Promise.resolve()
const persist = (record: RunnerDiscoveryRecord): Promise<void> => {
  const run = async () => {
    const finalPath = getRecordPath(record.pid)
    const tmpPath = `${finalPath}.tmp`

    await fs.ensureDir(path.dirname(finalPath))
    await fs.writeJson(tmpPath, record)
    await fs.rename(tmpPath, finalPath)
  }

  const next = persistChain.then(run, run)

  persistChain = next.catch(() => {})

  return next
}

export const runnerDiscovery = {
  async write ({ projectRoot, serverPort, testingType = null }: { projectRoot: string, serverPort: number, testingType?: TestingType | null }): Promise<void> {
    if (isDisabled()) {
      return
    }

    const record: RunnerDiscoveryRecord = {
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
      debug('wrote runner discovery record %o', record)
    } catch (err) {
      debug('failed to write runner discovery record: %o', err)
    }
  },

  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('runner discovery cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
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
        debug('skipping runner discovery removal; a newer record is live')

        return
      }

      await fs.remove(getRecordPath(state.pid))
      debug('removed runner discovery record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove runner discovery record: %o', err)
    }
  },
}

export const _resetForTesting = (): void => {
  currentState = null
  persistChain = Promise.resolve()
}
