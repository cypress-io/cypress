import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import fs from 'fs-extra'
import http from 'http'
import type { AddressInfo } from 'net'

import state from '../../lib/tasks/state'
import {
  isPidAlive,
  verifyRunnerRecord,
  readRunnerRecords,
  findLiveRunner,
  findReadyRunner,
  getRunnerInstancesDir,
  pruneDeadDiscoveryRecords,
  RunnerDiscoveryError,
} from '../../lib/runner-instances'

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
const INSTANCE_ID = 'a1b2c3d4-0000-4000-8000-000000000000'

const makeRecord = (overrides: Record<string, any> = {}) => {
  return JSON.stringify({
    schemaVersion: 1,
    pid: 1234,
    projectRoot: PROJECT,
    serverPort: 1,
    instanceId: INSTANCE_ID,
    testingType: 'e2e',
    ...overrides,
  })
}

const CDP_WS_URL = 'ws://127.0.0.1:9222/devtools/browser/abc'

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

describe('lib/runner-instances', () => {
  const servers: http.Server[] = []

  const startFakeRunner = async ({ instanceId = INSTANCE_ID, respondWith = null as Record<string, any> | null, hang = false } = {}): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (hang) {
        return
      }

      if (req.url === `/__cypress/runner-instances/${instanceId}`) {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(respondWith ?? { instanceId }))

        return
      }

      res.statusCode = 404
      res.end()
    })

    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

    return (server.address() as AddressInfo).port
  }

  const getClosedPort = async (): Promise<number> => {
    const server = http.createServer()

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

    const port = (server.address() as AddressInfo).port

    await new Promise((resolve) => server.close(resolve))

    return port
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(state.getCacheDir).mockReturnValue(CACHE_DIR)
  })

  afterEach(async () => {
    mockfs.restore()
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))))
    servers.length = 0
  })

  describe('.getRunnerInstancesDir', () => {
    it('joins the cache dir with runners/', () => {
      expect(getRunnerInstancesDir()).to.equal(RUNNERS_DIR)
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

  describe('.verifyRunnerRecord', () => {
    const recordFor = (serverPort: number, instanceId = INSTANCE_ID) => {
      return JSON.parse(makeRecord({ serverPort, instanceId }))
    }

    it('resolves the record with the live CDP state when the runner echoes the instanceId', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: CDP_WS_URL } })
      const record = recordFor(port)

      expect(await verifyRunnerRecord(record)).toEqual({
        ...record,
        cdpBrowserWsUrl: CDP_WS_URL,
      })
    })

    it('normalizes a missing or junk cdpBrowserWsUrl in the probe response to null', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: 42 } })

      expect((await verifyRunnerRecord(recordFor(port)))!.cdpBrowserWsUrl).toBeNull()
    })

    it('is null when nothing is listening on the recorded port', async () => {
      const port = await getClosedPort()

      expect(await verifyRunnerRecord(recordFor(port))).toBeNull()
    })

    it('is null when the responder does not know the instanceId (recycled port)', async () => {
      const port = await startFakeRunner({ instanceId: 'some-other-instance' })

      expect(await verifyRunnerRecord(recordFor(port))).toBeNull()
    })

    it('is null when the echoed instanceId does not match', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: 'impostor' } })

      expect(await verifyRunnerRecord(recordFor(port))).toBeNull()
    })

    it('is null when the response is not JSON', async () => {
      const server = http.createServer((_req, res) => res.end('<html>not a runner</html>'))

      servers.push(server)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

      const { port } = server.address() as AddressInfo

      expect(await verifyRunnerRecord(recordFor(port))).toBeNull()
    })

    it('is null when the probe times out', async () => {
      const port = await startFakeRunner({ hang: true })

      expect(await verifyRunnerRecord(recordFor(port), 100)).toBeNull()
    })
  })

  describe('.readRunnerRecords', () => {
    it('returns [] when the runners dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await readRunnerRecords()).toEqual([])
    })

    it('parses <pid>.json records and skips temp/junk/corrupt/incompatible files', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json.tmp': 'partial write',
          'notes.txt': 'not a record',
          '333.json': '{ not valid json',
          '444.json': JSON.stringify({ schemaVersion: 0, pid: 444, projectRoot: PROJECT, cdpStatus: 'no_browser', cdpBrowserWsUrl: null }),
          '555.json': makeRecord({ pid: 555, testingType: 'not-a-testing-type' }),
        },
      })

      const records = await readRunnerRecords()

      expect(records.map((r) => r.pid)).toEqual([111])
    })

    it('reads e2e, component, and null testing types', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, testingType: 'e2e' }),
          '222.json': makeRecord({ pid: 222, testingType: 'component' }),
          '333.json': makeRecord({ pid: 333, testingType: null }),
        },
      })

      const byPid = Object.fromEntries((await readRunnerRecords()).map((r) => [r.pid, r.testingType]))

      expect(byPid).toEqual({ 111: 'e2e', 222: 'component', 333: null })
    })
  })

  describe('.findLiveRunner', () => {
    it('returns the live runner state once its runner echoes the instanceId', async () => {
      const port = await startFakeRunner()

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const runner = await findLiveRunner(PROJECT)

      expect(runner.pid).toBe(111)
      expect(runner.cdpBrowserWsUrl).toBeNull()
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

    it('throws STALE_DISCOVERY_FILE when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(findLiveRunner(PROJECT)).rejects.toMatchObject({ code: 'STALE_DISCOVERY_FILE' })
    })

    it('skips a stale record and returns the verified one for the same project', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startFakeRunner({ instanceId: 'live-instance' })

      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: closedPort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort, instanceId: 'live-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await findLiveRunner(PROJECT)).pid).toBe(222)
    })

    it('targets a specific instance by pid', async () => {
      const port = await startFakeRunner()

      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await findLiveRunner(PROJECT, { instance: 222 })).pid).toBe(222)
      await expect(findLiveRunner(PROJECT, { instance: 999 })).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })
  })

  describe('.findReadyRunner', () => {
    it('takes the live CDP endpoint from the probe response, not the disk record', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: CDP_WS_URL } })

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const runner = await findReadyRunner(PROJECT)

      expect(runner.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_BROWSER_ATTACHED when the runner is live but has no browser', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: null } })

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('propagates NO_DISCOVERY_FILE from findLiveRunner', async () => {
      mockfs({ [CACHE_DIR]: {} })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })
  })

  describe('.pruneDeadDiscoveryRecords', () => {
    it('removes dead-pid and unverified live-pid records, keeps verified ones and non-record files', async () => {
      const livePort = await startFakeRunner()
      const closedPort = await getClosedPort()

      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          '222.json': makeRecord({ pid: 222 }),
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
          'keep.txt': 'not a record',
        },
      })

      stubKill({ alive: [111, 333] })

      expect(await pruneDeadDiscoveryRecords()).toBe(2)
      expect(await fs.pathExists(`${RUNNERS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${RUNNERS_DIR}/222.json`)).toBe(false)
      expect(await fs.pathExists(`${RUNNERS_DIR}/333.json`)).toBe(false)
      expect(await fs.pathExists(`${RUNNERS_DIR}/keep.txt`)).toBe(true)
    })

    it('keeps unreadable or incompatible records while their pid is taken', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': '{ not valid json',
          '222.json': JSON.stringify({ schemaVersion: 0, pid: 222, projectRoot: PROJECT }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect(await pruneDeadDiscoveryRecords()).toBe(0)
      expect(await fs.pathExists(`${RUNNERS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${RUNNERS_DIR}/222.json`)).toBe(true)
    })

    it('returns 0 when the runners dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadDiscoveryRecords()).toBe(0)
    })
  })
})
