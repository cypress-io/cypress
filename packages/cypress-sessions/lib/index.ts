import path from 'path'

export * from './tap-contract'

export * from './tap-operations'

export type { TapSpecsQuery, TapSpecsQueryVariables, TapRunSpecMutation, TapRunSpecMutationVariables } from './generated/graphql'

export const SCHEMA_VERSION = 1

export const MIN_SCHEMA_VERSION = 1

export const SESSIONS_DIRNAME = 'sessions'

const RECORD_EXTENSION = '.json'

export const SESSIONS_ROUTE_PREFIX = '/__cypress/sessions/'

export const SESSION_ID_HEADER = 'x-cypress-session-id'

// Fixed rather than namespaced, as the sessions route is: the CLI has to find it
// knowing only the port from the record.
export const TAP_GRAPHQL_ROUTE_PREFIX = '/__cypress/tap/graphql/'

export type SessionTestingType = 'e2e' | 'component' | null

export interface CypressSession {
  schemaVersion: number
  pid: number
  projectRoot: string
  serverPort: number
  sessionId: string
  testingType: SessionTestingType
}

export interface LiveSessionState extends CypressSession {
  cdpBrowserWsUrl: string | null
  /** Display name of the browser the session has open (e.g. `Chrome`), or `null` when none is open. */
  browserName: string | null
  /** Family of the browser the session has open (e.g. `chromium`), or `null` when none is open. */
  browserFamily: string | null
  /** sha256 hash of the OS machine GUID (node-machine-id), or `null` when unresolvable. */
  machineId: string | null
  /** Cloud user id of the logged-in user, or `null` when logged out or not yet resolved. */
  userId: string | null
}

export interface ReadySessionState extends LiveSessionState {
  cdpBrowserWsUrl: string
}

export const TAP_SUPPORTED_BROWSER_FAMILY = 'chromium'

// tap drives the browser over CDP, which only Chromium-based browsers speak. A
// null family means no browser is open yet — nothing to call unsupported.
export const isTapSupportedBrowser = (browserFamily: string | null): boolean => {
  return browserFamily === null || browserFamily === TAP_SUPPORTED_BROWSER_FAMILY
}

export const recordFileName = (pid: number): string => {
  return `${pid}${RECORD_EXTENSION}`
}

export const parseRecordPid = (entry: string): number | null => {
  if (path.extname(entry) !== RECORD_EXTENSION) {
    return null
  }

  const pid = Number(path.basename(entry, RECORD_EXTENSION))

  return Number.isInteger(pid) ? pid : null
}

export const cypressSessionsDir = (cacheRoot: string): string => {
  return path.join(cacheRoot, SESSIONS_DIRNAME)
}

export const recordPath = (cacheRoot: string, pid: number): string => {
  return path.join(cypressSessionsDir(cacheRoot), recordFileName(pid))
}

export const sessionProbePath = (sessionId: string): string => {
  return `${SESSIONS_ROUTE_PREFIX}${sessionId}`
}

export const tapGraphqlPath = (operationName: string): string => {
  return `${TAP_GRAPHQL_ROUTE_PREFIX}${operationName}`
}

const isValidTestingType = (value: any): value is SessionTestingType => {
  return value === 'e2e' || value === 'component' || value === null
}

export const isCompatibleRecord = (record: any): record is CypressSession => {
  return Boolean(record)
    && typeof record.schemaVersion === 'number'
    && record.schemaVersion >= MIN_SCHEMA_VERSION
    && typeof record.pid === 'number'
    && typeof record.projectRoot === 'string'
    && Number.isInteger(record.serverPort)
    && typeof record.sessionId === 'string'
    && record.sessionId.length > 0
    && isValidTestingType(record.testingType)
}
