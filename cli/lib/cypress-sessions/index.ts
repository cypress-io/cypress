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

// Reads, filters by pid, and probes for liveness. Throws when nothing matches —
// SESSION_NOT_FOUND for a pid that named nothing, NO_SESSION when none was asked
// for — STALE_SESSION when matches exist but none responds, and
// UNSUPPORTED_BROWSER when every one that does has a browser tap cannot drive.
const liveMatches = async (options: ResolveSessionOptions): Promise<LiveSessionState[]> => {
  const { session, cwd, probeTimeoutMs } = options
  const records = await readLiveSessions()

  // A project that failed to load has a starting record but no session to drive, so it is
  // never among the matches
  const matches = records.filter((record) => !isStartingRecord(record) && matchesSession(record, session))

  // With nothing live to drive, or only sessions of other projects when none was named, a
  // project that failed to load at the caller's directory is the one to report. Cypress is
  // running, so telling an agent to start it would start a second one.
  const noneAtCwd = session === undefined && !matches.some((record) => matchesProject(record, cwd))

  if (matches.length === 0 || noneAtCwd) {
    const starting = await readStartingSessions()

    if (starting.some((record) => matchesSession(record, session) && (matches.length === 0 || matchesProject(record, cwd)))) {
      throw new TapError('PROJECT_NOT_LOADED')
    }
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

  // Dropped before selection so a session running an unsupported browser never
  // shadows one that can serve the command; when it is the only candidate the
  // caller hears why rather than "no browser attached".
  const supported = live.filter((record) => isTapSupportedBrowser(record.browserFamily))

  if (supported.length === 0) {
    throw new TapError('UNSUPPORTED_BROWSER')
  }

  return supported
}

// Resolves a live session without requiring a browser; `status` reports
// sessions that have no browser attached yet.
export const resolveLiveSession = async (options: ResolveSessionOptions): Promise<LiveSessionSelection> => {
  const live = await liveMatches(options)

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
