import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import fs from 'fs-extra'
import http from 'http'
import type { AddressInfo } from 'net'

import state from '../../lib/tasks/state'
import {
  isPidAlive,
  verifySessionRecord,
  readSessionRecords,
  resolveSession,
  resolveLiveSession,
  listLiveSessions,
  getSessionsDir,
  pruneDeadSessionRecords,
  resolvedSessionId,
  resolvedSessionIdentity,
  CypressSessionError,
} from '../../lib/cypress-sessions'

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
const SESSIONS_DIR = `${CACHE_DIR}/sessions`
const PROJECT = '/projects/app'
const SESSION_ID = 'a1b2c3d4-0000-4000-8000-000000000000'

const makeRecord = (overrides: Record<string, any> = {}) => {
  return JSON.stringify({
    schemaVersion: 1,
    pid: 1234,
    projectRoot: PROJECT,
    serverPort: 1,
    sessionId: SESSION_ID,
    testingType: 'e2e',
    ...overrides,
  })
}

// Set per-test to a reachable fake DevTools endpoint so the liveness probe's
// CDP reachability check passes; tests that need an unreachable endpoint build
// their own url from a closed port.
let CDP_WS_URL!: string

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

describe('lib/cypress-sessions', () => {
  const servers: http.Server[] = []

  const startFakeSession = async ({ sessionId = SESSION_ID, respondWith = null as Record<string, any> | null, hang = false } = {}): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (hang) {
        return
      }

      if (req.url === `/__cypress/sessions/${sessionId}`) {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(respondWith ?? { sessionId }))

        return
      }

      res.statusCode = 404
      res.end()
    })

    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

    return (server.address() as AddressInfo).port
  }

  // A browser's DevTools HTTP endpoint answering /json/version, so the liveness
  // probe's CDP reachability check treats CDP_WS_URL as a live browser.
  const startFakeCdpEndpoint = async (): Promise<number> => {
    const server = http.createServer((req, res) => {
      if (req.url === '/json/version') {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ webSocketDebuggerUrl: 'ws://127.0.0.1/devtools/browser/abc' }))

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

  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.mocked(state.getCacheDir).mockReturnValue(CACHE_DIR)

    CDP_WS_URL = `ws://127.0.0.1:${await startFakeCdpEndpoint()}/devtools/browser/abc`
  })

  afterEach(async () => {
    mockfs.restore()
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))))
    servers.length = 0
  })

  describe('.getSessionsDir', () => {
    it('joins the cache dir with sessions/', () => {
      expect(getSessionsDir()).to.equal(SESSIONS_DIR)
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

  describe('.verifySessionRecord', () => {
    const recordFor = (serverPort: number, sessionId = SESSION_ID) => {
      return JSON.parse(makeRecord({ serverPort, sessionId }))
    }

    it('resolves the record with the live CDP state and browser when the session echoes the sessionId', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: CDP_WS_URL, browserName: 'Chrome', browserFamily: 'chromium', machineId: 'machine-hash', userId: 'cloud-user-1' } })
      const record = recordFor(port)

      expect(await verifySessionRecord(record)).toEqual({
        ...record,
        cdpBrowserWsUrl: CDP_WS_URL,
        browserName: 'Chrome',
        browserFamily: 'chromium',
        machineId: 'machine-hash',
        userId: 'cloud-user-1',
      })
    })

    it('normalizes identity fields an older session omits (or junks) to null', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, machineId: 42 } })
      const live = await verifySessionRecord(recordFor(port))

      expect(live!.machineId).toBeNull()
      expect(live!.userId).toBeNull()
    })

    it('keeps the browser the session has open even when the CDP endpoint is unreachable', async () => {
      const deadCdpPort = await getClosedPort()
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: `ws://127.0.0.1:${deadCdpPort}/devtools/browser/abc`, browserName: 'Chrome', browserFamily: 'chromium' } })
      const live = await verifySessionRecord(recordFor(port))

      expect(live!.cdpBrowserWsUrl).toBeNull()
      expect(live!.browserName).toBe('Chrome')
      expect(live!.browserFamily).toBe('chromium')
    })

    it('normalizes a browser an older session omits (or junks) to null', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, browserFamily: 42 } })
      const live = await verifySessionRecord(recordFor(port))

      expect(live!.browserName).toBeNull()
      expect(live!.browserFamily).toBeNull()
    })

    it('normalizes a missing or junk cdpBrowserWsUrl in the probe response to null', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: 42 } })

      expect((await verifySessionRecord(recordFor(port)))!.cdpBrowserWsUrl).toBeNull()
    })

    it('nulls the CDP endpoint when the browser is gone, even though the probe still echoes a url', async () => {
      const deadCdpPort = await getClosedPort()
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: `ws://127.0.0.1:${deadCdpPort}/devtools/browser/abc` } })

      expect((await verifySessionRecord(recordFor(port)))!.cdpBrowserWsUrl).toBeNull()
    })

    it('nulls a malformed cdpBrowserWsUrl that has no reachable endpoint to derive', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: 'not-a-ws-url' } })

      expect((await verifySessionRecord(recordFor(port)))!.cdpBrowserWsUrl).toBeNull()
    })

    it('is null when nothing is listening on the recorded port', async () => {
      const port = await getClosedPort()

      expect(await verifySessionRecord(recordFor(port))).toBeNull()
    })

    it('is null when the responder does not know the sessionId (recycled port)', async () => {
      const port = await startFakeSession({ sessionId: 'some-other-session' })

      expect(await verifySessionRecord(recordFor(port))).toBeNull()
    })

    it('is null when the echoed sessionId does not match', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: 'impostor' } })

      expect(await verifySessionRecord(recordFor(port))).toBeNull()
    })

    it('is null when the response is not JSON', async () => {
      const server = http.createServer((_req, res) => res.end('<html>not cypress</html>'))

      servers.push(server)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

      const { port } = server.address() as AddressInfo

      expect(await verifySessionRecord(recordFor(port))).toBeNull()
    })

    it('is null when the probe times out', async () => {
      const port = await startFakeSession({ hang: true })

      expect(await verifySessionRecord(recordFor(port), 100)).toBeNull()
    })
  })

  describe('.readSessionRecords', () => {
    it('returns [] when the sessions dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await readSessionRecords()).toEqual([])
    })

    it('parses <pid>.json records and skips temp/junk/corrupt/incompatible files', async () => {
      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111 }),
          '222.json.tmp': 'partial write',
          'notes.txt': 'not a record',
          '333.json': '{ not valid json',
          '444.json': JSON.stringify({ schemaVersion: 0, pid: 444, projectRoot: PROJECT, cdpStatus: 'no_browser', cdpBrowserWsUrl: null }),
          '555.json': makeRecord({ pid: 555, testingType: 'not-a-testing-type' }),
        },
      })

      const records = await readSessionRecords()

      expect(records.map((r) => r.pid)).toEqual([111])
    })

    it('reads e2e, component, and null testing types', async () => {
      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, testingType: 'e2e' }),
          '222.json': makeRecord({ pid: 222, testingType: 'component' }),
          '333.json': makeRecord({ pid: 333, testingType: null }),
        },
      })

      const byPid = Object.fromEntries((await readSessionRecords()).map((r) => [r.pid, r.testingType]))

      expect(byPid).toEqual({ 111: 'e2e', 222: 'component', 333: null })
    })
  })

  describe('.resolveSession', () => {
    // resolveSession requires an attached browser, so its happy-path fake session
    // must echo a CDP endpoint in the probe response.
    const startReadySession = (sessionId: string) => {
      return startFakeSession({ sessionId, respondWith: { sessionId, cdpBrowserWsUrl: CDP_WS_URL } })
    }

    it('uses a lone live session wherever it lives, ignoring the cwd (reason: only)', async () => {
      const port = await startReadySession(SESSION_ID)

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveSession({ cwd: '/somewhere/unrelated' })

      expect(selection.session.pid).toBe(111)
      expect(selection.reason).toBe('only')
      expect(selection.candidateCount).toBe(1)
      // The live CDP endpoint comes from the probe response, not the disk record.
      expect(selection.session.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_SESSION when no record matches the filters', async () => {
      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [111] })

      await expect(resolveSession({ session: 999, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_SESSION' })
    })

    it('remembers the id of the session it selected', async () => {
      const port = await startReadySession(SESSION_ID)

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await resolveSession({ cwd: PROJECT })

      expect(resolvedSessionId()).toBe(SESSION_ID)
    })

    it('remembers the identity the probe carried for the session it selected', async () => {
      const port = await startFakeSession({
        respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: CDP_WS_URL, machineId: 'machine-hash', userId: 'cloud-user-1' },
      })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await resolveSession({ cwd: PROJECT })

      expect(resolvedSessionIdentity()).toEqual({ sessionId: SESSION_ID, machineId: 'machine-hash', userId: 'cloud-user-1' })
    })

    it('reaps the leftover record and throws NO_SESSION when the only match’s process is dead', async () => {
      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      const err = await resolveSession({ cwd: PROJECT }).catch((e) => e)

      expect(err).toBeInstanceOf(CypressSessionError)
      expect(err.code).toBe('NO_SESSION')
      // The dead-process leftover is reaped, so it stops masquerading as a
      // still-running-but-unresponsive (stale) session on later commands.
      expect(fs.existsSync(`${SESSIONS_DIR}/111.json`)).toBe(false)
    })

    it('throws STALE_SESSION when the pid is taken but nothing answers the probe (recycled pid)', async () => {
      const port = await getClosedPort()

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveSession({ cwd: PROJECT })).rejects.toMatchObject({ code: 'STALE_SESSION' })
      // An alive-but-unresponsive process is genuinely stale, not gone — its
      // record is kept (only dead-pid leftovers are reaped).
      expect(fs.existsSync(`${SESSIONS_DIR}/111.json`)).toBe(true)
    })

    it('throws NO_BROWSER_ATTACHED when the chosen session is live but has no browser', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: null } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveSession({ cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_BROWSER_ATTACHED' })
    })

    it('throws UNSUPPORTED_BROWSER when the only session runs a browser tap cannot drive', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: null, browserName: 'Firefox', browserFamily: 'firefox' } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const err = await resolveSession({ session: 111, cwd: PROJECT }).catch((e) => e)

      // Not NO_BROWSER_ATTACHED: a Firefox session never attaches one, so the
      // "open a browser" guidance would send the user in a circle.
      expect(err.code).toBe('UNSUPPORTED_BROWSER')
      expect(err.message).toBe('The Cypress session is running on an unsupported browser.\n\nRun Cypress open on a Chromium-based browser to use `cypress tap`.')
    })

    it('resolves a Chromium session over a live one at the cwd running an unsupported browser', async () => {
      const readyPort = await startReadySession('ready-session')
      const firefoxPort = await startFakeSession({ sessionId: 'firefox-session', respondWith: { sessionId: 'firefox-session', cdpBrowserWsUrl: null, browserName: 'Firefox', browserFamily: 'firefox' } })

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: PROJECT, serverPort: firefoxPort, sessionId: 'firefox-session' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: readyPort, sessionId: 'ready-session' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveSession({ cwd: PROJECT })

      expect(selection.session.pid).toBe(222)
      expect(selection.candidateCount).toBe(1)
    })

    it('resolves a browser-attached session over a live one at the cwd that has none', async () => {
      const readyPort = await startReadySession('ready-session')
      const browserlessPort = await startFakeSession({ sessionId: 'browserless-session', respondWith: { sessionId: 'browserless-session', cdpBrowserWsUrl: null } })

      mockfs({
        [SESSIONS_DIR]: {
          // The cwd-rooted session has no browser, so it cannot be the target
          // even though it would otherwise win by cwd-match.
          '111.json': makeRecord({ pid: 111, projectRoot: PROJECT, serverPort: browserlessPort, sessionId: 'browserless-session' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: readyPort, sessionId: 'ready-session' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveSession({ cwd: PROJECT })

      expect(selection.session.pid).toBe(222)
      expect(selection.session.cdpBrowserWsUrl).toBe(CDP_WS_URL)
      // Only the browser-attached session is a candidate.
      expect(selection.reason).toBe('only')
      expect(selection.candidateCount).toBe(1)
    })

    it('skips a stale record and resolves the live one', async () => {
      const closedPort = await getClosedPort()
      const livePort = await startReadySession('live-session')

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: closedPort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort, sessionId: 'live-session' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveSession({ cwd: PROJECT })

      expect(selection.session.pid).toBe(222)
      // Only the verified-live record counts as a candidate.
      expect(selection.candidateCount).toBe(1)
    })

    it('targets a specific session by pid (reason: explicit)', async () => {
      const port = await startReadySession(SESSION_ID)

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveSession({ session: 222, cwd: PROJECT })

      expect(selection.session.pid).toBe(222)
      expect(selection.reason).toBe('explicit')
      await expect(resolveSession({ session: 999, cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_SESSION' })
    })

    it('prefers the session rooted at the cwd when several are live (reason: cwd-match)', async () => {
      const appPort = await startReadySession('app-session')
      const otherPort = await startReadySession('other-session')

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, sessionId: 'app-session' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, sessionId: 'other-session' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const selection = await resolveSession({ cwd: '/projects/other' })

      expect(selection.session.pid).toBe(222)
      expect(selection.reason).toBe('cwd-match')
      expect(selection.candidateCount).toBe(2)
    })

    it('falls back to the lowest pid when several are live and none match the cwd (reason: arbitrary)', async () => {
      const aPort = await startReadySession('a-session')
      const bPort = await startReadySession('b-session')

      mockfs({
        [SESSIONS_DIR]: {
          // '1000.json' sorts before '999.json', so the read order is 1000 then
          // 999 — picking 999 proves the choice is by lowest pid, not read order.
          '1000.json': makeRecord({ pid: 1000, projectRoot: '/projects/a', serverPort: aPort, sessionId: 'a-session' }),
          '999.json': makeRecord({ pid: 999, projectRoot: '/projects/b', serverPort: bPort, sessionId: 'b-session' }),
        },
      })

      stubKill({ alive: [1000, 999] })

      const selection = await resolveSession({ cwd: '/unrelated/dir' })

      expect(selection.session.pid).toBe(999)
      expect(selection.reason).toBe('arbitrary')
      expect(selection.candidateCount).toBe(2)
    })
  })

  describe('.resolveLiveSession', () => {
    it('resolves a live session that has no browser attached, instead of throwing', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: null } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveLiveSession({ cwd: PROJECT })

      expect(selection.session.pid).toBe(111)
      expect(selection.reason).toBe('only')
      expect(selection.session.cdpBrowserWsUrl).toBeNull()
    })

    it('carries the live CDP endpoint when a browser is attached', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, cdpBrowserWsUrl: CDP_WS_URL } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const selection = await resolveLiveSession({ cwd: PROJECT })

      expect(selection.session.cdpBrowserWsUrl).toBe(CDP_WS_URL)
    })

    it('throws NO_SESSION when no record matches the filters', async () => {
      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, projectRoot: '/other/project' }) } })
      stubKill({ alive: [111] })

      const err = await resolveLiveSession({ session: 999, cwd: PROJECT }).catch((e) => e)

      expect(err.code).toBe('NO_SESSION')
      // resolveLiveSession serves pre-browser commands (specs/status), so the
      // guidance must not tell the user to open a browser.
      expect(err.message).not.toMatch(/browser/i)
    })

    it('reaps the leftover record and throws NO_SESSION when the only match’s process is dead', async () => {
      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111 }) } })
      stubKill({ alive: [] })

      await expect(resolveLiveSession({ cwd: PROJECT })).rejects.toMatchObject({ code: 'NO_SESSION' })
      expect(fs.existsSync(`${SESSIONS_DIR}/111.json`)).toBe(false)
    })

    // The commands that never need a browser (specs/status) still run against the
    // session's own runner, so an unsupported browser rules them out too.
    it('throws UNSUPPORTED_BROWSER when the only session runs a browser tap cannot drive', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, browserName: 'WebKit', browserFamily: 'webkit' } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      await expect(resolveLiveSession({ cwd: PROJECT })).rejects.toMatchObject({ code: 'UNSUPPORTED_BROWSER' })
    })
  })

  describe('.listLiveSessions', () => {
    it('returns every verified-live session across all projects, with its CDP state', async () => {
      const appPort = await startFakeSession({ sessionId: 'app-session', respondWith: { sessionId: 'app-session', cdpBrowserWsUrl: CDP_WS_URL } })
      const otherPort = await startFakeSession({ sessionId: 'other-session' })

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, projectRoot: '/projects/app', serverPort: appPort, sessionId: 'app-session' }),
          '222.json': makeRecord({ pid: 222, projectRoot: '/projects/other', serverPort: otherPort, sessionId: 'other-session' }),
        },
      })

      stubKill({ alive: [111, 222] })

      const sessions = await listLiveSessions()

      expect(sessions.map((session) => session.pid).sort()).toEqual([111, 222])
      expect(sessions.find((session) => session.pid === 111)!.cdpBrowserWsUrl).toBe(CDP_WS_URL)
      // No endpoint in the probe response — no browser attached.
      expect(sessions.find((session) => session.pid === 222)!.cdpBrowserWsUrl).toBeNull()
    })

    // Unlike the resolvers, listing is how a user finds out a session is
    // running a browser tap cannot drive — so it must not hide one.
    it('lists a session running a browser tap cannot drive', async () => {
      const port = await startFakeSession({ respondWith: { sessionId: SESSION_ID, browserName: 'Firefox', browserFamily: 'firefox' } })

      mockfs({ [SESSIONS_DIR]: { '111.json': makeRecord({ pid: 111, serverPort: port }) } })
      stubKill({ alive: [111] })

      const sessions = await listLiveSessions()

      expect(sessions.map((session) => session.browserFamily)).toEqual(['firefox'])
    })

    it('resolves an empty list when no record exists', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await listLiveSessions()).toEqual([])
    })

    it('skips dead-pid and unverified (recycled-pid) records', async () => {
      const livePort = await startFakeSession()
      const closedPort = await getClosedPort()

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          // pid is dead — skipped without a probe
          '222.json': makeRecord({ pid: 222, serverPort: livePort }),
          // pid looks alive but nothing answers — recycled pid, skipped
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
        },
      })

      stubKill({ alive: [111, 333] })

      expect((await listLiveSessions()).map((session) => session.pid)).toEqual([111])
    })

    it('still lists live sessions when a dead record cannot be reaped', async () => {
      const livePort = await startFakeSession()

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          '222.json': makeRecord({ pid: 222, serverPort: livePort }),
        },
      })

      stubKill({ alive: [111] })
      // Reaping the dead 222 record fails (e.g. a Windows file lock); discovery of
      // the live session must not be aborted by an undeletable leftover.
      const remove = vi.spyOn(fs, 'remove').mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))

      expect((await listLiveSessions()).map((session) => session.pid)).toEqual([111])
      expect(remove).toHaveBeenCalled()
    })

    it('filters by pid', async () => {
      const port = await startFakeSession()

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: port }),
          '222.json': makeRecord({ pid: 222, serverPort: port }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect((await listLiveSessions({ session: 222 })).map((session) => session.pid)).toEqual([222])
    })
  })

  describe('.pruneDeadSessionRecords', () => {
    it('removes dead-pid and unverified live-pid records, keeps verified ones and non-record files', async () => {
      const livePort = await startFakeSession()
      const closedPort = await getClosedPort()

      mockfs({
        [SESSIONS_DIR]: {
          '111.json': makeRecord({ pid: 111, serverPort: livePort }),
          '222.json': makeRecord({ pid: 222 }),
          '333.json': makeRecord({ pid: 333, serverPort: closedPort }),
          'keep.txt': 'not a record',
        },
      })

      stubKill({ alive: [111, 333] })

      expect(await pruneDeadSessionRecords()).toBe(2)
      expect(await fs.pathExists(`${SESSIONS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${SESSIONS_DIR}/222.json`)).toBe(false)
      expect(await fs.pathExists(`${SESSIONS_DIR}/333.json`)).toBe(false)
      expect(await fs.pathExists(`${SESSIONS_DIR}/keep.txt`)).toBe(true)
    })

    it('keeps unreadable or incompatible records while their pid is taken', async () => {
      mockfs({
        [SESSIONS_DIR]: {
          '111.json': '{ not valid json',
          '222.json': JSON.stringify({ schemaVersion: 0, pid: 222, projectRoot: PROJECT }),
        },
      })

      stubKill({ alive: [111, 222] })

      expect(await pruneDeadSessionRecords()).toBe(0)
      expect(await fs.pathExists(`${SESSIONS_DIR}/111.json`)).toBe(true)
      expect(await fs.pathExists(`${SESSIONS_DIR}/222.json`)).toBe(true)
    })

    it('returns 0 when the sessions dir does not exist', async () => {
      mockfs({ [CACHE_DIR]: {} })

      expect(await pruneDeadSessionRecords()).toBe(0)
    })
  })
})
