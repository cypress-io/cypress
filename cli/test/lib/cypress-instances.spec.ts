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
  resolveInstance,
  resolveLiveInstance,
  listLiveInstances,
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

  describe('.resolveInstance', () => {
    // resolveInstance requires an attached browser, so its happy-path fake instance
    // must echo a CDP endpoint in the probe response.
    const startReadyInstance = (instanceId: string) => {
      return startFakeInstance({ instanceId, respondWith: { instanceId, cdpBrowserWsUrl: CDP_WS_URL } })
    }

    it('uses a lone live instance wherever it lives, ignoring the cwd (reason: only)', async () => {
      const port = await startReadyInstance(INSTANCE_ID)

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveInstance({ cwd: '/somewhere/unrelated' })

      expect(selection.instance.pid).toBe(111)
      expect(selection.reason).toBe('only')
      expect(selection.candidateCount).toBe(1)
      // The live CDP endpoint comes from the probe response, not the disk record.
      expect(selection.instance.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_INSTANCE when no record matches the filters', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [111] })

      await expect(resolveInstance({ instance: 999, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_INSTANCE' })
    })

    it('reaps the leftover record and throws NO_INSTANCE when the only match’s process is dead', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      const err = await resolveInstance({ cwd: PROJECT }).catch((e) => e)

      expect(err).toBeInstanceOf(CypressInstanceError)
      expect(err.code).toBe('NO_INSTANCE')
      // The dead-process leftover is reaped, so it stops masquerading as a
      // still-running-but-unresponsive (stale) instance on later commands.
      expect(fs.existsSync(`${INSTANCES_DIR}/111.json`)).toBe(false)
    })

    it('throws STALE_INSTANCE when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveInstance({ cwd: PROJECT })).rejects.toMatchObject({ code: 'STALE_INSTANCE' })
      // An alive-but-unresponsive process is genuinely stale, not gone — its
      // record is kept (only dead-pid leftovers are reaped).
      expect(fs.existsSync(`${INSTANCES_DIR}/111.json`)).toBe(true)
    })

    it('throws NO_BROWSER_ATTACHED when the chosen instance is live but has no browser', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: null } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveInstance({ cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('resolves a browser-attached instance over a live one at the cwd that has none', async () => {
      const readyPort = await startReadyInstance('ready-instance')
      const browserlessPort = await startFakeInstance({ instanceId: 'browserless-instance', respondWith: { instanceId: 'browserless-instance', cdpBrowserWsUrl: null } })

      mockfs({
        [INSTANCES_DIR]: {
          // The cwd-rooted instance has no browser, so it cannot be the target
          // even though it would otherwise win by cwd-match.
          '111.json': makeRecord({ pid: 111, projectRoot: PROJECT, serverPort: browserlessPort, instanceId: 'browserless-instance' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: readyPort, instanceId: 'ready-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveInstance({ cwd: PROJECT })

      expect(selection.instance.pid).toBe(222)
      expect(selection.instance.cdpBrowserWsUrl).toBe(CDP_WS_URL)
      // Only the browser-attached instance is a candidate.
      expect(selection.reason).toBe('only')
      expect(selection.candidateCount).toBe(1)
    })

    it('skips a stale record and resolves the live one', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startReadyInstance('live-instance')

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: closedPort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort, instanceId: 'live-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveInstance({ cwd: PROJECT })

      expect(selection.instance.pid).toBe(222)
      // Only the verified-live record counts as a candidate.
      expect(selection.candidateCount).toBe(1)
    })

    it('targets a specific instance by pid (reason: explicit)', async () => {
      const port = await startReadyInstance(INSTANCE_ID)

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveInstance({ instance: 222, cwd: PROJECT })

      expect(selection.instance.pid).toBe(222)
      expect(selection.reason).toBe('explicit')
      await expect(resolveInstance({ instance: 999, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_INSTANCE' })
    })

    it('prefers the instance rooted at the cwd when several are live (reason: cwd-match)', async () => {
      const appPort = await startReadyInstance('app-instance')
      const otherPort = await startReadyInstance('other-instance')

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, instanceId: 'app-instance' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, instanceId: 'other-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveInstance({ cwd: '/projects/other' })

      expect(selection.instance.pid).toBe(222)
      expect(selection.reason).toBe('cwd-match')
      expect(selection.candidateCount).toBe(2)
    })

    it('falls back to the lowest pid when several are live and none match the cwd (reason: arbitrary)', async () => {
      const aPort = await startReadyInstance('a-instance')
      const bPort = await startReadyInstance('b-instance')

      mockfs({
        [INSTANCES_DIR]: {
          // '1000.json' sorts before '999.json', so the read order is 1000 then
          // 999 — picking 999 proves the choice is by lowest pid, not read order.
          '1000.json': makeRecord({ pid: 1000, projectRoot: '/projects/a', serverPort: aPort, instanceId: 'a-instance' }),
          '999.json': makeRecord({ pid: 999, projectRoot: '/projects/b', serverPort: bPort, instanceId: 'b-instance' }),
        },
      })

      stubKill({ alive: [1000, 999] })

      const selection = await resolveInstance({ cwd: '/unrelated/dir' })

      expect(selection.instance.pid).toBe(999)
      expect(selection.reason).toBe('arbitrary')
      expect(selection.candidateCount).toBe(2)
    })
  })

  describe('.resolveLiveInstance', () => {
    it('resolves a live instance that has no browser attached, instead of throwing', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: null } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveLiveInstance({ cwd: PROJECT })

      expect(selection.instance.pid).toBe(111)
      expect(selection.reason).toBe('only')
      expect(selection.instance.cdpBrowserWsUrl).toBeNull()
    })

    it('carries the live CDP endpoint when a browser is attached', async () => {
      const port = await startFakeInstance({ respondWith: { instanceId: INSTANCE_ID, cdpBrowserWsUrl: CDP_WS_URL } })

      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveLiveInstance({ cwd: PROJECT })

      expect(selection.instance.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_INSTANCE when no record matches the filters', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111, projectRoot: '/other/project' }) } })
      stubKill({ alive: [111] })

      const err = await resolveLiveInstance({ instance: 999, cwd: PROJECT }).catch((e) => e)

      expect(err.code).toBe('NO_INSTANCE')
      // resolveLiveInstance serves pre-browser commands (specs/status), so the
      // guidance must not tell the user to open a browser.
      expect(err.message).not.toMatch(/browser/i)
    })

    it('reaps the leftover record and throws NO_INSTANCE when the only match’s process is dead', async () => {
      mockfs({ [INSTANCES_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      await expect(resolveLiveInstance({ cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_INSTANCE' })
      expect(fs.existsSync(`${INSTANCES_DIR}/111.json`)).toBe(false)
    })
  })

  describe('.listLiveInstances', () => {
    it('returns every verified-live instance across all projects, with its CDP state', async () => {
      const appPort = await startFakeInstance({ instanceId: 'app-instance', respondWith: { instanceId: 'app-instance', cdpBrowserWsUrl: CDP_WS_URL } })
      const otherPort = await startFakeInstance({ instanceId: 'other-instance' })

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, instanceId: 'app-instance' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, instanceId: 'other-instance' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const instances = await listLiveInstances()

      expect(instances.map((instance) => instance.pid).sort()).toEqual([111, 222])
      expect(instances.find((instance) => instance.pid === 111)!.cdpBrowserWsUrl).toBe(CDP_WS_URL)
      // No endpoint in the probe response — no browser attached.
      expect(instances.find((instance) => instance.pid === 222)!.cdpBrowserWsUrl).toBeNull()
    })

    it('resolves an empty list when no record exists', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await listLiveInstances()).toEqual([])
    })

    it('skips dead-pid and unverified (recycled-pid) records', async () => {
      const livePort = await startFakeInstance()
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

      expect((await listLiveInstances()).map((instance) => instance.pid)).toEqual([111])
    })

    it('still lists live instances when a dead record cannot be reaped', async () => {
      const livePort = await startFakeInstance()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort }),
        },
      })

      stubKill({ alive: [111] })
      // Reaping the dead 222 record fails (e.g. a Windows file lock); discovery of
      // the live instance must not be aborted by an undeletable leftover.
      const remove = vi.spyOn(fs, 'remove').mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))

      expect((await listLiveInstances()).map((instance) => instance.pid)).toEqual([111])
      expect(remove).toHaveBeenCalled()
    })

    it('filters by pid', async () => {
      const port = await startFakeInstance()

      mockfs({
        [INSTANCES_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await listLiveInstances({ instance: 222 })).map((instance) => instance.pid)).toEqual([222])
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
