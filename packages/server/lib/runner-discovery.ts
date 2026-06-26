import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { TestingType } from '@packages/types'
// This is the producer side of the runner-discovery contract. The record schema,
// the `instances/` dir name, and the `<pid>.json` filename all come from
// @packages/runner-discovery, which the consumer (the cypress CLI) shares — so the
// two sides stay in sync by construction rather than by hand-mirrored constants.
import { INSTANCES_DIRNAME, SCHEMA_VERSION, recordFileName } from '@packages/runner-discovery'
import type { RunnerDiscoveryRecord, LiveRunnerState } from '@packages/runner-discovery'
import { resolveCypressCacheRoot } from './util/cypress-cache'

export type { RunnerDiscoveryRecord, LiveRunnerState } from '@packages/runner-discovery'

const debug = Debug('cypress:server:runner-discovery')

export const getRunnerDiscoveryDir = (): string => {
  return path.join(resolveCypressCacheRoot(), INSTANCES_DIRNAME)
}

const getRecordPath = (pid: number): string => {
  return path.join(getRunnerDiscoveryDir(), recordFileName(pid))
}

let currentState: LiveRunnerState | null = null

let persistChain: Promise<void> = Promise.resolve()
const persist = (record: RunnerDiscoveryRecord): Promise<void> => {
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

export const runnerDiscovery = {
  async captureRecord ({ projectRoot, serverPort, testingType = null }: { projectRoot: string, serverPort: number, testingType?: TestingType | null }): Promise<void> {
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
