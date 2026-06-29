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
  resolveRunner,
  listLiveRunners,
  getRunnerDiscoveryDir,
  pruneDeadDiscoveryRecords,
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

describe('lib/runner-discovery', () => {
  const servers: http.Server[] = []

  const startFakeRunner = async ({ instanceId = INSTANCE_ID, respondWith = null as Record<string, any> | null, hang = false } = {}): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (hang) {
        return
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
    it('joins the cache dir with instances/', () => {
      expect(getRunnerDiscoveryDir()).to.equal(INSTANCES_DIR)
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
    it('returns [] when the instances dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await readRunnerRecords()).toEqual([])
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

      const records = await readRunnerRecords()

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

      const byPid = Object.fromEntries((await readRunnerRecords()).map((r) => [r.pid, r.testingType]))

      expect(byPid).toEqual({ 111: 'e2e', 222: 'component', 333: null })
    })
  })

  describe('.resolveRunner', () => {
    // resolveRunner requires an attached browser, so its happy-path fake runner
    // must echo a CDP endpoint in the probe response.
    const startReadyRunner = (instanceId: string) => {
      return startFakeRunner({ instanceId, respondWith: { instanceId, cdpBrowserWsUrl: CDP_WS_URL } })
    }

    it('uses a lone live runner wherever it lives, ignoring the cwd (reason: only)', async () => {
      const port = await startReadyRunner(INSTANCE_ID)

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      // cwd is unrelated to the runner's project — a single instance is used anyway.
      const selection = await resolveRunner({ cwd: '/somewhere/unrelated' })

      expect(selection.runner.pid).toBe(111)
      expect(selection.reason).toBe('only')
      expect(selection.candidateCount).toBe(1)
      // The live CDP endpoint comes from the probe response, not the disk record.
      expect(selection.runner.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_DISCOVERY_FILE when no record matches the filters', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, projectRoot: '/other/project' }) } })
      stubKill({ alive: [111] })

      await expect(resolveRunner({ project: PROJECT, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })

    it('throws STALE_DISCOVERY_FILE when a match exists but its process is dead', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      const err = await resolveRunner({ cwd: PROJECT }).catch((e) => e)

      expect(err).toBeInstanceOf(RunnerDiscoveryError)
      expect(err.code).toBe('STALE_DISCOVERY_FILE')
    })

    it('throws STALE_DISCOVERY_FILE when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveRunner({ cwd: PROJECT })).rejects.toMatchObject({ code: 'STALE_DISCOVERY_FILE' })
    })

    it('throws NO_BROWSER_ATTACHED when the chosen runner is live but has no browser', async () => {
      const port = await startFakeRunner({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: null } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveRunner({ cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('skips a stale record and resolves the live one matching the same project', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startReadyRunner('live-instance')

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: closedPort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort, instanceId: 'live-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveRunner({ project: PROJECT, cwd: PROJECT })

      expect(selection.runner.pid).toBe(222)
      // Only the verified-live record counts as a candidate.
      expect(selection.candidateCount).toBe(1)
    })

    it('targets a specific instance by pid (reason: explicit)', async () => {
      const port = await startReadyRunner(INSTANCE_ID)

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveRunner({ instance: 222, cwd: PROJECT })

      expect(selection.runner.pid).toBe(222)
      expect(selection.reason).toBe('explicit')
      await expect(resolveRunner({ instance: 999, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_DISCOVERY_FILE' })
    })

    it('prefers the runner rooted at the cwd when several are live (reason: cwd-match)', async () => {
      const appPort = await startReadyRunner('app-instance')
      const otherPort = await startReadyRunner('other-instance')

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, instanceId: 'app-instance' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, instanceId: 'other-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveRunner({ cwd: '/projects/other' })

      expect(selection.runner.pid).toBe(222)
      expect(selection.reason).toBe('cwd-match')
      expect(selection.candidateCount).toBe(2)
    })

    it('falls back to the lowest pid when several are live and none match the cwd (reason: arbitrary)', async () => {
      const aPort = await startReadyRunner('a-instance')
      const bPort = await startReadyRunner('b-instance')

      mockfs({
        [INSTANCES_DIR]: {
          // '1000.json' sorts before '999.json', so the read order is 1000 then
          // 999 — picking 999 proves the choice is by lowest pid, not read order.
          '1000.json': makeRecord({ pid: 1000, projectRoot: '/projects/a', serverPort: aPort, instanceId: 'a-instance' }),
          '999.json': makeRecord({ pid: 999, projectRoot: '/projects/b', serverPort: bPort, instanceId: 'b-instance' }),
        },
      })

      stubKill({ alive: [1000, 999] })

      const selection = await resolveRunner({ cwd: '/unrelated/dir' })

      expect(selection.runner.pid).toBe(999)
      expect(selection.reason).toBe('arbitrary')
      expect(selection.candidateCount).toBe(2)
    })
  })

  describe('.listLiveRunners', () => {
    it('returns every verified-live runner across all projects, with its CDP state', async () => {
      const appPort = await startFakeRunner({ instanceId: 'app-instance', respondWith: { instanceId: 'app-instance', cdpBrowserWsUrl: CDP_WS_URL } })
      const otherPort = await startFakeRunner({ instanceId: 'other-instance' })

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, instanceId: 'app-instance' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, instanceId: 'other-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const runners = await listLiveRunners()

      expect(runners.map((runner) => runner.pid).sort()).toEqual([111, 222])
      expect(runners.find((runner) => runner.pid === 111)!.cdpBrowserWsUrl).toBe(CDP_WS_URL)
      // No endpoint in the probe response — no browser attached.
      expect(runners.find((runner) => runner.pid === 222)!.cdpBrowserWsUrl).toBeNull()
    })

    it('resolves an empty list when no record exists', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await listLiveRunners()).toEqual([])
    })

    it('skips dead-pid and unverified (recycled-pid) records', async () => {
      const livePort = await startFakeRunner()
      const closedPort = await getClosedPort()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          // pid is dead — skipped without a probe
          '222.json': makeRecord({ pid: 222, serverPort: livePort }),
          // pid looks alive but nothing answers — recycled pid, skipped
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
        },
      })

      stubKill({ alive: [111, 333] })

      expect((await listLiveRunners()).map((runner) => runner.pid)).toEqual([111])
    })

    it('filters by project root', async () => {
      const port = await startFakeRunner()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: port }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await listLiveRunners({ projectRoot: '/projects/app' })).map((runner) => runner.pid)).toEqual([111])
    })

    it('filters by pid', async () => {
      const port = await startFakeRunner()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await listLiveRunners({ instance: 222 })).map((runner) => runner.pid)).toEqual([222])
    })
  })

  describe('.pruneDeadDiscoveryRecords', () => {
    it('removes dead-pid and unverified live-pid records, keeps verified ones and non-record files', async () => {
      const livePort = await startFakeRunner()
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

      expect(await pruneDeadDiscoveryRecords()).toBe(2)
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

      expect(await pruneDeadDiscoveryRecords()).toBe(0)
      expect(await fs.pathExists(`${INSTANCES_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${INSTANCES_DIR}/222.json`)).toBe(true)
    })

    it('returns 0 when the instances dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadDiscoveryRecords()).toBe(0)
    })
  })
})
