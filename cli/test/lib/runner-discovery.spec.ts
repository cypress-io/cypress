import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import fs from 'fs-extra'

import state from '../../lib/tasks/state'
import {
  isPidAlive,
  readRunnerRecords,
  findLiveRunner,
  findReadyRunner,
  getRunnerDiscoveryDir,
  pruneDeadRecords,
  RunnerDiscoveryError,
} from '../../lib/runner-discovery'

vi.mock('../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getCacheDir: vi.fn(),
    },
  }
})

const CACHE_DIR = '/.cache/Cypress'
const RUNNERS_DIR = `${CACHE_DIR}/runners`
const PROJECT = '/projects/app'

const makeRecord = (overrides: Record<string, any> = {}) => {
  return JSON.stringify({
    schemaVersion: 2,
    pid: 1234,
    cypressVersion: '1.2.3',
    projectRoot: PROJECT,
    cdpStatus: 'no_browser',
    cdpBrowserWsUrl: null,
    ...overrides,
  })
}

// Deterministically control PID liveness regardless of the host machine.
const stubKill = ({ alive = [], eperm = [] }: { alive?: number[], eperm?: number[] }) => {
  vi.spyOn(process, 'kill').mockImplementation(((pid: number) => {
    if (eperm.includes(pid)) {
      throw Object.assign(new Error('EPERM'), { code: 'EPERM' })
    }

    if (alive.includes(pid)) {
      return true
    }

    throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' })
  }) as any)
}

describe('lib/runner-discovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(state.getCacheDir).mockReturnValue(CACHE_DIR)
  })

  afterEach(() => {
    mockfs.restore()
  })

  describe('.getRunnerDiscoveryDir', () => {
    it('joins the cache dir with runners/', () => {
      expect(getRunnerDiscoveryDir()).to.equal(RUNNERS_DIR)
    })
  })

  describe('.isPidAlive', () => {
    it('is true when the process can be signalled', () => {
      stubKill({ alive: [111] })
      expect(isPidAlive(111)).toBe(true)
    })

    it('is true on EPERM (alive but owned by another user)', () => {
      stubKill({ eperm: [111] })
      expect(isPidAlive(111)).toBe(true)
    })

    it('is false on ESRCH (no such process)', () => {
      stubKill({ alive: [] })
      expect(isPidAlive(111)).toBe(false)
    })
  })

  describe('.readRunnerRecords', () => {
    it('returns [] when the runners dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await readRunnerRecords()).toEqual([])
    })

    it('parses <pid>.json records and skips temp/junk/corrupt files', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json.tmp': 'partial write',
          'notes.txt': 'not a record',
          '333.json': '{ not valid json',
        },
      })

      const records = await readRunnerRecords()

      expect(records.map((r) => r.pid)).toEqual([111])
    })
  })

  describe('.findLiveRunner', () => {
    it('returns the live record matching the project root', async () => {
      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [111] })

      const record = await findLiveRunner(PROJECT)

      expect(record.pid).toBe(111)
    })

    it('throws NO_DISCOVERY_FILE when no record matches the project', async () => {
      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, projectRoot: '/other/project' }) } })
      stubKill({ alive: [111] })

      await expect(findLiveRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })

    it('throws STALE_DISCOVERY_FILE when a match exists but its process is dead', async () => {
      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      const err = await findLiveRunner(PROJECT).catch((e) => e)

      expect(err).toBeInstanceOf(RunnerDiscoveryError)
      expect(err.code).toBe('STALE_DISCOVERY_FILE')
    })

    it('targets a specific instance by pid', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json': makeRecord({ pid: 222 }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await findLiveRunner(PROJECT, { instance: 222 })).pid).toBe(222)
      await expect(findLiveRunner(PROJECT, { instance: 999 })).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })
  })

  describe('.findReadyRunner', () => {
    it('returns a record with a live CDP endpoint', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, cdpStatus: 'ready', cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc' }),
        },
      })

      stubKill({ alive: [111] })

      const record = await findReadyRunner(PROJECT)

      expect(record.cdpBrowserWsUrl).toBe('ws://127.0.0.1:9222/devtools/browser/abc')
    })

    it('throws NO_BROWSER_ATTACHED when the runner is live but has no browser', async () => {
      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, cdpStatus: 'no_browser' }) } })
      stubKill({ alive: [111] })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('throws NO_BROWSER_ATTACHED for a ready record missing cdpBrowserWsUrl', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, cdpStatus: 'ready', cdpBrowserWsUrl: null }),
        },
      })

      stubKill({ alive: [111] })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('propagates NO_DISCOVERY_FILE from findLiveRunner', async () => {
      mockfs({ [CACHE_DIR]: {} })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })
  })

  describe('.pruneDeadRecords', () => {
    it('removes dead-pid records, keeps live ones and non-record files', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json': makeRecord({ pid: 222 }),
          'keep.txt': 'not a record',
        },
      })

      stubKill({ alive: [111] })

      expect(await pruneDeadRecords()).toBe(1)
      expect(await fs.pathExists(`${RUNNERS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${RUNNERS_DIR}/222.json`)).toBe(false)
      expect(await fs.pathExists(`${RUNNERS_DIR}/keep.txt`)).toBe(true)
    })

    it('returns 0 when the runners dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadRecords()).toBe(0)
    })
  })
})
