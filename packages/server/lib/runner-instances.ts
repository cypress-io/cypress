import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
import type { TestingType } from '@packages/types'
// This is the producer side of the runner-instances contract. The record schema,
// the `instances/` dir name, and the `<pid>.json` filename all come from
// @packages/runner-instances, which the consumer (the cypress CLI) shares — so the
// two sides stay in sync by construction rather than by hand-mirrored constants.
import { INSTANCES_DIRNAME, SCHEMA_VERSION, recordFileName } from '@packages/runner-instances'
import type { RunnerInstance, LiveRunnerState } from '@packages/runner-instances'
import { resolveCypressCacheRoot } from './util/cypress-cache'

export type { RunnerInstance, LiveRunnerState } from '@packages/runner-instances'

const debug = Debug('cypress:server:runner-instances')

export const getRunnerInstancesDir = (): string => {
  return path.join(resolveCypressCacheRoot(), INSTANCES_DIRNAME)
}

const getRecordPath = (pid: number): string => {
  return path.join(getRunnerInstancesDir(), recordFileName(pid))
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
      debug('wrote runner instances record %o', record)
    } catch (err) {
      debug('failed to write runner instances record: %o', err)
    }
  },

  setCdpBrowserWsUrl (cdpBrowserWsUrl: string | null): void {
    if (!currentState) {
      return
    }

    currentState = { ...currentState, cdpBrowserWsUrl }
    debug('runner instances cdpBrowserWsUrl is now %o', cdpBrowserWsUrl)
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
        debug('skipping runner instances removal; a newer record is live')

        return
      }

      await fs.remove(getRecordPath(state.pid))
      debug('removed runner instances record for pid %d', state.pid)
    } catch (err) {
      debug('failed to remove runner instances record: %o', err)
    }
  },
}

export const _resetForTesting = (): void => {
  currentState = null
  persistChain = Promise.resolve()
}
