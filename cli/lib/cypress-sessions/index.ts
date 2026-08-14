import path from 'path'

import { CypressSessionError, isTapSupportedBrowser } from './record'
import type { LiveSessionState, ReadySessionState, CypressSession } from './record'
import { isPidAlive, verifySessionRecord } from './liveness'
import { readLiveSessions } from './store'

export { CypressSessionError, SESSIONS_DIRNAME, isTapSupportedBrowser } from './record'

export type { LiveSessionState, ReadySessionState, CypressSessionErrorCode, CypressSession } from './record'

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

// A dead pid is skipped without a probe (it proves the writer is gone); the
// survivors carry the live browser CDP state from their probe response.
const probeMatches = async (matches: CypressSession[], probeTimeoutMs?: number): Promise<LiveSessionState[]> => {
  const probed = await Promise.all(matches.map(async (record) => {
    return isPidAlive(record.pid) ? verifySessionRecord(record, probeTimeoutMs) : null
  }))

  return probed.filter((session): session is LiveSessionState => session !== null)
}

export const listLiveSessions = async (options: ListSessionOptions = {}): Promise<LiveSessionState[]> => {
  const records = await readLiveSessions()

  const matches = records.filter((record) => matchesSession(record, options.session))

  return probeMatches(matches, options.probeTimeoutMs)
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

const describeFilter = (session: number | undefined): string => {
  if (session !== undefined) {
    return ` with pid ${session}`
  }

  return ''
}

const lowestPid = <T extends LiveSessionState>(sessions: T[]): T => {
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

const describeSession = (sessions: LiveSessionState[], session: number | undefined): string => {
  if (sessions.length === 1) {
    return ` (pid ${sessions[0].pid}, ${sessions[0].projectRoot})`
  }

  return describeFilter(session)
}

// Reads, filters by pid, and probes for liveness. Throws NO_SESSION when
// nothing matches, STALE_SESSION when matches exist but none responds, and
// UNSUPPORTED_BROWSER when every one that does has a browser tap cannot drive.
const liveMatches = async (options: ResolveSessionOptions): Promise<LiveSessionState[]> => {
  const { session, probeTimeoutMs } = options
  const records = await readLiveSessions()

  const matches = records.filter((record) => matchesSession(record, session))

  if (matches.length === 0) {
    throw new CypressSessionError(
      'NO_SESSION',
      `No Cypress session found${describeFilter(session)}. This command requires Cypress running in open mode. Start Cypress in open mode and try again.`,
    )
  }

  const live = await probeMatches(matches, probeTimeoutMs)

  if (live.length === 0) {
    throw new CypressSessionError(
      'STALE_SESSION',
      `Cypress was previously running${describeFilter(session)}, but is no longer responding. Cypress likely exited uncleanly; start Cypress in open mode and try again.`,
    )
  }

  // Dropped before selection so a session running an unsupported browser never
  // shadows one that can serve the command; when it is the only candidate the
  // caller hears why rather than "no browser attached".
  const supported = live.filter((record) => isTapSupportedBrowser(record.browserFamily))

  if (supported.length === 0) {
    throw new CypressSessionError(
      'UNSUPPORTED_BROWSER',
      'The Cypress session is running on an unsupported browser.\n\nRun Cypress open on a Chromium-based browser to use `cypress tap`.',
    )
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
    throw new CypressSessionError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running${describeSession(live, options.session)}, but no test browser is open. Open a browser in Cypress and try again.`,
    )
  }

  const { session: selected, reason } = selectSession(ready, options)

  lastResolvedIdentity = { sessionId: selected.sessionId, machineId: selected.machineId, userId: selected.userId }

  return { session: selected, reason, candidateCount: ready.length }
}
