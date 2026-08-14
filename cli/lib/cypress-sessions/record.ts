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

export type CypressSessionErrorCode =
  | 'NO_SESSION'
  | 'STALE_SESSION'
  | 'NO_BROWSER_ATTACHED'
  | 'UNSUPPORTED_BROWSER'
  | 'RENDERER_UNRESPONSIVE'

export class CypressSessionError extends Error {
  code: CypressSessionErrorCode

  constructor (code: CypressSessionErrorCode, message: string) {
    super(message)
    this.name = 'CypressSessionError'
    this.code = code
  }
}
