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
const INSTANCE_ID = 'a1b2c3d4-0000-4000-8000-000000000000'

const makeRecord = (overrides: Record<string, any> = {}) => {
  return JSON.stringify({
    schemaVersion: 3,
    pid: 1234,
    cypressVersion: '1.2.3',
    projectRoot: PROJECT,
    serverPort: 1,
    instanceId: INSTANCE_ID,
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
  // Real localhost servers standing in for running Cypress instances. mock-fs
  // only intercepts the fs module, so these run unaffected alongside it.
  const servers: http.Server[] = []

  /**
   * Serve the discovery probe route the way the Cypress server does: echo the
   * record for the matching instanceId, 404 anything else.
   */
  const startFakeRunner = async ({ instanceId = INSTANCE_ID, respondWith = null as Record<string, any> | null, hang = false } = {}): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (hang) {
        return // never respond — exercises the probe timeout
      }

      if (req.url === `/__cypress/runner-discovery/${instanceId}`) {
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

  // A port with nothing listening — the post-crash / recycled-pid scenario.
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

  describe('.verifyRunnerRecord', () => {
    const recordFor = (serverPort: number, instanceId = INSTANCE_ID) => {
      return JSON.parse(makeRecord({ serverPort, instanceId }))
    }

    it('is true when the runner echoes the instanceId', async () => {
      const port = await startFakeRunner()

      expect(await verifyRunnerRecord(recordFor(port))).toBe(true)
    })

    it('is false when nothing is listening on the recorded port', async () => {
      const port = await getClosedPort()

      expect(await verifyRunnerRecord(recordFor(port))).toBe(false)
    })

    it('is false when the responder does not know the instanceId (recycled port)', async () => {
      const port = await startFakeRunner({ instanceId: 'some-other-instance' })

      expect(await verifyRunnerRecord(recordFor(port))).toBe(false)
    })

    it('is false when the echoed instanceId does not match', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: 'impostor' } })

      expect(await verifyRunnerRecord(recordFor(port))).toBe(false)
    })

    it('is false when the response is not JSON', async () => {
      const server = http.createServer((_req, res) => res.end('<html>not a runner</html>'))

      servers.push(server)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

      const { port } = server.address() as AddressInfo

      expect(await verifyRunnerRecord(recordFor(port))).toBe(false)
    })

    it('is false when the probe times out', async () => {
      const port = await startFakeRunner({ hang: true })

      expect(await verifyRunnerRecord(recordFor(port), 100)).toBe(false)
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
          // pre-v3 schema: no serverPort/instanceId, so liveness can't be verified
          '444.json': JSON.stringify({ schemaVersion: 2, pid: 444, projectRoot: PROJECT, cdpStatus: 'no_browser', cdpBrowserWsUrl: null }),
        },
      })

      const records = await readRunnerRecords()

      expect(records.map((r) => r.pid)).toEqual([111])
    })
  })

  describe('.findLiveRunner', () => {
    it('returns the record once its runner echoes the instanceId', async () => {
      const port = await startFakeRunner()

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
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

    it('throws STALE_DISCOVERY_FILE when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      // The pid looks alive — it belongs to some unrelated process now.
      stubKill({ alive: [111] })

      await expect(findLiveRunner(PROJECT)).rejects.toMatchObject({ code: 'STALE_DISCOVERY_FILE' })
    })

    it('skips a stale record and returns the verified one for the same project', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startFakeRunner({ instanceId: 'live-instance' })

      mockfs({
        [RUNNERS_DIR]: {
          // readdir order puts the stale record first; the probe rejects it
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
    it('returns a record with a live CDP endpoint', async () => {
      const port = await startFakeRunner()

      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port, cdpStatus: 'ready', cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc' }),
        },
      })

      stubKill({ alive: [111] })

      const record = await findReadyRunner(PROJECT)

      expect(record.cdpBrowserWsUrl).toBe('ws://127.0.0.1:9222/devtools/browser/abc')
    })

    it('throws NO_BROWSER_ATTACHED when the runner is live but has no browser', async () => {
      const port = await startFakeRunner()

      mockfs({ [RUNNERS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port, cdpStatus: 'no_browser' }) } })
      stubKill({ alive: [111] })

      await expect(findReadyRunner(PROJECT)).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('throws NO_BROWSER_ATTACHED for a ready record missing cdpBrowserWsUrl', async () => {
      const port = await startFakeRunner()

      mockfs({
        [RUNNERS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port, cdpStatus: 'ready', cdpBrowserWsUrl: null }),
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
    it('removes dead-pid and unverified live-pid records, keeps verified ones and non-record files', async () => {
      const livePort = await startFakeRunner()
      const closedPort = await getClosedPort()

      mockfs({
        [RUNNERS_DIR]: {
          // verified: pid taken and the runner answers
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          // dead pid: removed without probing
          '222.json': makeRecord({ pid: 222 }),
          // recycled pid: taken, but nothing answers the probe
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
          'keep.txt': 'not a record',
        },
      })

      stubKill({ alive: [111, 333] })

      expect(await pruneDeadRecords()).toBe(2)
      expect(await fs.pathExists(`${RUNNERS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${RUNNERS_DIR}/222.json`)).toBe(false)
      expect(await fs.pathExists(`${RUNNERS_DIR}/333.json`)).toBe(false)
      expect(await fs.pathExists(`${RUNNERS_DIR}/keep.txt`)).toBe(true)
    })

    it('keeps unreadable or incompatible records while their pid is taken', async () => {
      mockfs({
        [RUNNERS_DIR]: {
          '111.json': '{ not valid json',
          '222.json': JSON.stringify({ schemaVersion: 2, pid: 222, projectRoot: PROJECT }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect(await pruneDeadRecords()).toBe(0)
      expect(await fs.pathExists(`${RUNNERS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${RUNNERS_DIR}/222.json`)).toBe(true)
    })

    it('returns 0 when the runners dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadRecords()).toBe(0)
    })
  })
})
