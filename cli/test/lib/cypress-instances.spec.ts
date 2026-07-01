import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import fs from 'fs-extra'
import http from 'http'
import type { AddressInfo } from 'net'

import state from '../../lib/tasks/state'
import {
  isPidAlive,
  verifyInstanceRecord,
  readInstanceRecords,
  findLiveInstance,
  findReadyInstance,
  getInstancesDir,
  pruneDeadInstanceRecords,
  CypressInstanceError,
} from '../../lib/cypress-instances'

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
const INSTANCES_DIR = `${CACHE_DIR}/instances`
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

describe('lib/cypress-instances', () => {
  const servers: http.Server[] = []

  const startFakeInstance = async ({ instanceId = INSTANCE_ID, respondWith = null as Record<string, any> | null, hang = false } = {}): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (hang) {
        return
      }

      if (req.url === `/__cypress/instances/${instanceId}`) {
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

  describe('.getInstancesDir', () => {
    it('joins the cache dir with instances/', () => {
      expect(getInstancesDir()).to.equal(INSTANCES_DIR)
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

  describe('.verifyInstanceRecord', () => {
    const recordFor = (serverPort: number, instanceId = INSTANCE_ID) => {
      return JSON.parse(makeRecord({ serverPort, instanceId }))
    }

    it('resolves the record with the live CDP state when the instance echoes the instanceId', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: CDP_WS_URL } })
      const record = recordFor(port)

      expect(await verifyInstanceRecord(record)).toEqual({
        ...record,
        cdpBrowserWsUrl: CDP_WS_URL,
      })
    })

    it('normalizes a missing or junk cdpBrowserWsUrl in the probe response to null', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: 42 } })

      expect((await verifyInstanceRecord(recordFor(port)))!.cdpBrowserWsUrl).toBeNull()
    })

    it('is null when nothing is listening on the recorded port', async () => {
      const port = await getClosedPort()

      expect(await verifyInstanceRecord(recordFor(port))).toBeNull()
    })

    it('is null when the responder does not know the instanceId (recycled port)', async () => {
      const port = await startFakeInstance({ instanceId: 'some-other-instance' })

      expect(await verifyInstanceRecord(recordFor(port))).toBeNull()
    })

    it('is null when the echoed instanceId does not match', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: 'impostor' } })

      expect(await verifyInstanceRecord(recordFor(port))).toBeNull()
    })

    it('is null when the response is not JSON', async () => {
      const server = http.createServer((_req, res) => res.end('<html>not cypress</html>'))

      servers.push(server)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

      const { port } = server.address() as AddressInfo

      expect(await verifyInstanceRecord(recordFor(port))).toBeNull()
    })

    it('is null when the probe times out', async () => {
      const port = await startFakeInstance({ hang: true })

      expect(await verifyInstanceRecord(recordFor(port), 100)).toBeNull()
    })
  })

  describe('.readInstanceRecords', () => {
    it('returns [] when the instances dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await readInstanceRecords()).toEqual([])
    })

    it('parses <pid>.json records and skips temp/junk/corrupt/incompatible files', async () => {
      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json.tmp': 'partial write',
          'notes.txt': 'not a record',
          '333.json': '{ not valid json',
          '444.json': JSON.stringify({ schemaVersion: 0, pid: 444, projectRoot: PROJECT, cdpStatus: 'no_browser', cdpBrowserWsUrl: null }),
          '555.json': makeRecord({ pid: 555, testingType: 'not-a-testing-type' }),
        },
      })

      const records = await readInstanceRecords()

      expect(records.map((r) => r.pid)).toEqual([111])
    })

    it('reads e2e, component, and null testing types', async () => {
      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, testingType: 'e2e' }),
          '222.json': makeRecord({ pid: 222, testingType: 'component' }),
          '333.json': makeRecord({ pid: 333, testingType: null }),
        },
      })

      const byPid = Object.fromEntries((await readInstanceRecords()).map((r) => [r.pid, r.testingType]))

      expect(byPid).toEqual({ 111: 'e2e', 222: 'component', 333: null })
    })
  })

  describe('.findLiveInstance', () => {
    it('returns the live instance state once its instance echoes the instanceId', async () => {
      const port = await startFakeInstance()

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const instance = await findLiveInstance(PROJECT)

      expect(instance.pid).toBe(111)
      expect(instance.cdpBrowserWsUrl).toBeNull()
    })

    it('throws NO_INSTANCE when no record matches the project', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, projectRoot: '/other/project' }) } })
      stubKill({ alive: [111] })

      await expect(findLiveInstance(PROJECT)).rejects.toMatchObject({ code: 'NO_INSTANCE' })
    })

    it('throws STALE_INSTANCE when a match exists but its process is dead', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      const err = await findLiveInstance(PROJECT).catch((e) => e)

      expect(err).toBeInstanceOf(CypressInstanceError)
      expect(err.code).toBe('STALE_INSTANCE')
    })

    it('throws STALE_INSTANCE when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(findLiveInstance(PROJECT)).rejects.toMatchObject({ code: 'STALE_INSTANCE' })
    })

    it('skips a stale record and returns the verified one for the same project', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startFakeInstance({ instanceId: 'live-instance' })

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: closedPort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort, instanceId: 'live-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await findLiveInstance(PROJECT)).pid).toBe(222)
    })

    it('targets a specific instance by pid', async () => {
      const port = await startFakeInstance()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await findLiveInstance(PROJECT, { instance: 222 })).pid).toBe(222)
      await expect(findLiveInstance(PROJECT, { instance: 999 })).rejects.toMatchObject({ code: 'NO_INSTANCE' })
    })
  })

  describe('.findReadyInstance', () => {
    it('takes the live CDP endpoint from the probe response, not the disk record', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: CDP_WS_URL } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const instance = await findReadyInstance(PROJECT)

      expect(instance.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_BROWSER_ATTACHED when the instance is live but has no browser', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: null } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(findReadyInstance(PROJECT)).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('propagates NO_INSTANCE from findLiveInstance', async () => {
      mockfs({ [CACHE_DIR]: {} })

      await expect(findReadyInstance(PROJECT)).rejects.toMatchObject({ code: 'NO_INSTANCE' })
    })
  })

  describe('.pruneDeadInstanceRecords', () => {
    it('removes dead-pid and unverified live-pid records, keeps verified ones and non-record files', async () => {
      const livePort = await startFakeInstance()
      const closedPort = await getClosedPort()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          '222.json': makeRecord({ pid: 222 }),
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
          'keep.txt': 'not a record',
        },
      })

      stubKill({ alive: [111, 333] })

      expect(await pruneDeadInstanceRecords()).toBe(2)
      expect(await fs.pathExists(`${INSTANCES_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${INSTANCES_DIR}/222.json`)).toBe(false)
      expect(await fs.pathExists(`${INSTANCES_DIR}/333.json`)).toBe(false)
      expect(await fs.pathExists(`${INSTANCES_DIR}/keep.txt`)).toBe(true)
    })

    it('keeps unreadable or incompatible records while their pid is taken', async () => {
      mockfs({
        [INSTANCES_DIR]: {
          '111.json': '{ not valid json',
          '222.json': JSON.stringify({ schemaVersion: 0, pid: 222, projectRoot: PROJECT }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect(await pruneDeadInstanceRecords()).toBe(0)
      expect(await fs.pathExists(`${INSTANCES_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${INSTANCES_DIR}/222.json`)).toBe(true)
    })

    it('returns 0 when the instances dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadInstanceRecords()).toBe(0)
    })
  })
})
