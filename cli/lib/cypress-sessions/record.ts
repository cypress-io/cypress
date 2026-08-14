export {
  SESSIONS_DIRNAME,
  isCompatibleRecord,
  isTapSupportedBrowser,
  parseRecordPid,
  cypressSessionsDir,
  sessionProbePath,
} from '@packages/cypress-sessions'

export type {
  CypressSession,
  LiveSessionState,
  ReadySessionState,
  SessionTestingType,
} from '@packages/cypress-sessions'

// Session discovery raises the same `TapError` every other tap failure is raised
// as, so one catch and one renderer cover the whole surface.
export { TapError, isTapError, SessionNotFoundTapError, TAP_TARGET } from '@packages/cypress-sessions'
