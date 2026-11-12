import path from 'path'

import { TapError, SessionNotFoundTapError, isTapSupportedBrowser, isStartingRecord } from './record'
import type { LiveSessionState, ReadySessionState, CypressSession } from './record'
import { verifySessionRecord } from './liveness'
import { readLiveSessions, readStartingSessions } from './store'

export { TAP_TARGET, TapError, isTapError, SESSIONS_DIRNAME, isTapSupportedBrowser } from './record'

export type { LiveSessionState, ReadySessionState, CypressSession } from './record'

export { isPidAlive, verifySessionRecord } from './liveness'

export { getSessionsDir, pruneDeadSessionRecords, readSessionRecords } from './store'

export interface ListSessionOptions {
  /** Optional pid filter; omitted lists every matching session. */
  session?: number
  probeTimeoutMs?: number
}

const matchesProject = (record: CypressSession, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

// An undefined pid does not constrain, so an absent filter lists
// every pid.
const matchesSession = (record: CypressSession, session: number | undefined): boolean => {
  return session === undefined || record.pid === session
}

// Every match is probed, whether or not its pid can be signalled from here: the
// pid check cannot see across PID namespaces. The survivors carry the live
// browser CDP state from their probe response.
const probeMatches = async (matches: CypressSession[], probeTimeoutMs?: number): Promise<LiveSessionState[]> => {
  const probed = await Promise.all(matches.map((record) => verifySessionRecord(record, probeTimeoutMs)))

  return probed.filter((session): session is LiveSessionState => session !== null)
}

export const listLiveSessions = async (options: ListSessionOptions = {}): Promise<LiveSessionState[]> => {
  const records = await readLiveSessions()

  const matches = records.filter((record) => !isStartingRecord(record) && matchesSession(record, options.session))

  return probeMatches(matches, options.probeTimeoutMs)
}

export interface FindStartingSessionOptions {
  session?: number
  cwd: string
}

// The session whose project failed to load, if there is one: it never became a
// live session, so `status` goes looking for it to say why, and every other command
// points to `status`. Prefers the project at the cwd, then the lowest pid, as
// selection does.
export const findStartingSession = async ({ session, cwd }: FindStartingSessionOptions): Promise<CypressSession | null> => {
  const starting = (await readStartingSessions()).filter((record) => matchesSession(record, session))

  if (starting.length === 0) {
    return null
  }

  const atCwd = starting.filter((record) => matchesProject(record, cwd))

  return lowestPid(atCwd.length > 0 ? atCwd : starting)
}

export type SessionSelectionReason = 'explicit' | 'only' | 'cwd-match' | 'arbitrary'

export interface SessionSelection {
  session: ReadySessionState
  reason: SessionSelectionReason
  candidateCount: number
}

// Like SessionSelection, but the chosen session may have no browser attached yet.
export interface LiveSessionSelection {
  session: LiveSessionState
  reason: SessionSelectionReason
  candidateCount: number
}

export interface ResolveSessionOptions {
  session?: number
  cwd: string
  probeTimeoutMs?: number
}

export interface ResolvedSessionIdentity {
  sessionId: string
  machineId: string | null
  userId: string | null
}

let lastResolvedIdentity: ResolvedSessionIdentity | null = null

// Read rather than threaded through every caller: each tap command resolves its
// own session, several of them below this module.
export const resolvedSessionIdentity = (): ResolvedSessionIdentity | null => lastResolvedIdentity

export const resolvedSessionId = (): string | null => lastResolvedIdentity?.sessionId ?? null

const lowestPid = <T extends CypressSession>(sessions: T[]): T => {
  return [...sessions].sort((a, b) => a.pid - b.pid)[0]
}

const selectSession = <T extends LiveSessionState>(candidates: T[], options: ResolveSessionOptions): { session: T, reason: SessionSelectionReason } => {
  if (candidates.length === 1) {
    const filtered = options.session !== undefined

    return { session: candidates[0], reason: filtered ? 'explicit' : 'only' }
  }

  const cwdMatches = candidates.filter((record) => matchesProject(record, options.cwd))

  if (cwdMatches.length > 0) {
    return { session: lowestPid(cwdMatches), reason: 'cwd-match' }
  }

  return { session: lowestPid(candidates), reason: 'arbitrary' }
}

// Whether the caller may be after a project that could not load: there is nothing usable to
// drive, or, with no session named, nothing usable at the caller's directory. Cypress is
// running, so reporting no session would have an agent start a second one.
const mayBeAfterUnloaded = (usable: CypressSession[], { session, cwd }: ResolveSessionOptions): boolean => {
  return usable.length === 0 || (session === undefined && !usable.some((record) => matchesProject(record, cwd)))
}

// The project that could not load which the caller is after, when `mayBeAfterUnloaded`: the
// one named, any of them when nothing usable is left, otherwise the one at the caller's directory
const soughtUnloaded = <T extends CypressSession>(usable: CypressSession[], unloaded: T[], { session, cwd }: ResolveSessionOptions): T | undefined => {
  return unloaded.find((record) => matchesSession(record, session) && (usable.length === 0 || matchesProject(record, cwd)))
}

// A session whose configuration broke after it started still answers, but whatever it runs
// or shows comes from the configuration that is gone. It is set aside like a project that
// never loaded, and reported the same way when it is the one the caller is after.
const setAsideBrokenSessions = (live: LiveSessionState[], options: ResolveSessionOptions): LiveSessionState[] => {
  const loaded = live.filter((record) => !record.loadError)
  const broken = mayBeAfterUnloaded(loaded, options) ? soughtUnloaded(loaded, live.filter((record) => record.loadError), options) : undefined

  if (broken) {
    // The session was found and answered, so the refusal is attributed to it
    lastResolvedIdentity = { sessionId: broken.sessionId, machineId: broken.machineId, userId: broken.userId }

    throw new TapError('PROJECT_NOT_LOADED')
  }

  return loaded
}

// Reads, filters by pid, and probes for liveness. Throws when nothing matches —
// SESSION_NOT_FOUND for a pid that named nothing, NO_SESSION when none was asked
// for — STALE_SESSION when matches exist but none responds, PROJECT_NOT_LOADED when
// the one sought broke after it started, and UNSUPPORTED_BROWSER when every one that
// is left has a browser tap cannot drive. `allowLoadError` keeps broken sessions, for
// `status` to report their error.
const liveMatches = async (options: ResolveSessionOptions, allowLoadError = false): Promise<LiveSessionState[]> => {
  const { session, probeTimeoutMs } = options
  const records = await readLiveSessions()

  // A project that failed to load has a starting record but no session to drive, so it is
  // never among the matches
  const matches = records.filter((record) => !isStartingRecord(record) && matchesSession(record, session))

  if (mayBeAfterUnloaded(matches, options) && soughtUnloaded(matches, await readStartingSessions(), options)) {
    throw new TapError('PROJECT_NOT_LOADED')
  }

  if (matches.length === 0) {
    throw session === undefined
      ? new TapError('NO_SESSION')
      : new SessionNotFoundTapError(session)
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new TapError('STALE_SESSION')
  }

  const usable = allowLoadError ? live : setAsideBrokenSessions(live, options)

  // Dropped before selection so a session running an unsupported browser never
  // shadows one that can serve the command; when it is the only candidate the
  // caller hears why rather than "no browser attached". A broken session stays
  // for `status`, whose report of the error does not depend on the browser.
  const supported = usable.filter((record) => record.loadError || isTapSupportedBrowser(record.browserFamily))

  if (supported.length === 0) {
    throw new TapError('UNSUPPORTED_BROWSER')
  }

  return supported
}

// Resolves a live session without requiring a browser; `status` reports
// sessions that have no browser attached yet, and, with `allowLoadError`, sessions
// whose configuration broke after they started.
export const resolveLiveSession = async (options: ResolveSessionOptions, { allowLoadError = false }: { allowLoadError?: boolean } = {}): Promise<LiveSessionSelection> => {
  const live = await liveMatches(options, allowLoadError)

  const { session, reason } = selectSession(live, options)

  lastResolvedIdentity = { sessionId: session.sessionId, machineId: session.machineId, userId: session.userId }

  return { session, reason, candidateCount: live.length }
}

// Adds the browser-readiness requirement to resolveLiveSession: the session
// it returns is guaranteed to have a browser attached. Gate on the browser
// before selecting so a browserless session never shadows a ready one that
// could serve the command.
export const resolveSession = async (options: ResolveSessionOptions): Promise<SessionSelection> => {
  const live = await liveMatches(options)

  const ready = live.filter((record): record is ReadySessionState => record.cdpBrowserWsUrl !== null)

  if (ready.length === 0) {
    throw new TapError('NO_BROWSER_ATTACHED')
  }

  const { session: selected, reason } = selectSession(ready, options)

  lastResolvedIdentity = { sessionId: selected.sessionId, machineId: selected.machineId, userId: selected.userId }

  return { session: selected, reason, candidateCount: ready.length }
}
