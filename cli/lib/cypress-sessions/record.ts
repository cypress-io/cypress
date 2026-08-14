export {
  INSTANCES_DIRNAME,
  isCompatibleRecord,
  isTapSupportedBrowser,
  parseRecordPid,
  cypressInstancesDir,
  instancesProbePath,
} from '@packages/cypress-sessions'

export type {
  CypressInstance,
  LiveInstanceState,
  ReadyInstanceState,
  InstanceTestingType,
} from '@packages/cypress-sessions'

export type CypressInstanceErrorCode =
  | 'NO_INSTANCE'
  | 'STALE_INSTANCE'
  | 'NO_BROWSER_ATTACHED'
  | 'UNSUPPORTED_BROWSER'
  | 'RENDERER_UNRESPONSIVE'

export class CypressInstanceError extends Error {
  code: CypressInstanceErrorCode

  constructor (code: CypressInstanceErrorCode, message: string) {
    super(message)
    this.name = 'CypressInstanceError'
    this.code = code
  }
}
