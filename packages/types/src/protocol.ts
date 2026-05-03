import type Database from 'better-sqlite3'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { IncomingHttpHeaders } from 'http'
import type { Readable } from 'stream'
import type { DebugData } from './studio/studio-server-types'
import type { ProxyTimings } from './proxy'
import type { FoundSpec } from './spec'

type Commands = ProtocolMapping.Commands
type Command<T extends keyof Commands> = Commands[T]
type Events = ProtocolMapping.Events
type Event<T extends keyof Events> = Events[T]

export interface CDPClient {
  send<T extends Extract<keyof Commands, string>> (command: T, params?: Command<T>['paramsType'][0]): Promise<Command<T>['returnType']>
  on<T extends Extract<keyof Events, string>> (eventName: T, cb: (event: Event<T>[0]) => void): void
  off (eventName: string, cb: (event: any) => void): void
}

export interface AppCaptureProtocolCommon {
  cdpReconnect (): Promise<void>
  addRunnables (runnables: any): void
  commandLogAdded (log: any): void
  commandLogChanged (log: any): void
  viewportChanged (input: any): void
  urlChanged (input: any): void
  beforeTest(test: Record<string, any>): Promise<void>
  preAfterTest(test: Record<string, any>, options: Record<string, any>): Promise<void>
  afterTest(test: Record<string, any>): Promise<void>
  afterSpec (): Promise<{ durations: AfterSpecDurations } | undefined>
  pageLoading (input: any): void
  resetTest (testId: string, currentRetry?: number): void
  responseEndedWithEmptyBody: (options: ResponseEndedWithEmptyBodyOptions) => void
  responseStreamReceived (options: ResponseStreamOptions): Readable | undefined
  responseStreamTimedOut (options: ResponseStreamTimedOutOptions): void
  cyRequestWillBeSent (options: CyRequestWillBeSentOptions): void
  cyRequestResponseReceived (options: CyRequestResponseReceivedOptions): void
  cyRequestFailed (options: CyRequestFailedOptions): void
}

export interface AppCaptureProtocolInterface extends AppCaptureProtocolCommon {
  getDbMetadata (): { offset: number, size: number } | undefined
  beforeSpec ({ spec, workingDirectory, archivePath, dbPath, db }: { spec: FoundSpec & { instanceId: string }, workingDirectory: string, archivePath: string, dbPath: string, db: Database.Database }): void
  uploadStallSamplingInterval: () => number
  connectToBrowser (cdpClient: CDPClient): Promise<void>
  cleanup (): void
}

export type ProtocolCaptureMethod = keyof AppCaptureProtocolInterface | 'setupProtocol' | 'prepareProtocol' | 'uploadCaptureArtifact' | 'getCaptureProtocolScript' | 'cdpClient.on' | 'getZippedDb' | 'UNKNOWN' | 'createProtocolArtifact' | 'protocolUploadUrl'

export interface ProtocolError {
  args?: any
  error: Error
  captureMethod: ProtocolCaptureMethod
  fatal?: boolean
  runnableId?: string
  isUploadError?: boolean
}

export const isProtocolInitializationError = (error: ProtocolError) => {
  return ['setupProtocol', 'beforeSpec', 'getCaptureProtocolScript'].includes(error.captureMethod)
}

type ProtocolErrorReportEntry = Omit<ProtocolError, 'fatal' | 'error'> & {
  message: string
  name: string
  stack: string
  lastSuccessfulRow?: string | null
}

type ProtocolErrorReportContext = {
  projectSlug?: string | null
  specName?: string | null
  osName?: string | null
}

export type ProtocolErrorReport = {
  runId?: string | null
  instanceId?: string | null
  captureHash?: string | null
  errors: ProtocolErrorReportEntry[]
  context?: ProtocolErrorReportContext
}

export type CaptureArtifact = {
  uploadUrl: string
  fileSize: number | bigint
  filePath: string
}

type ProjectConfig = {
  devServerPublicPathRoute: string
  namespace: string
  port: number | null
  proxyUrl?: string
}

export type ProtocolManagerOptions = {
  runId: string
  testingType: 'e2e' | 'component'
  projectId?: string
  cloudApi: {
    url: string
    retryWithBackoff (fn: (attemptIndex: number) => Promise<any>): Promise<any>
    requestPromise: {
      get (options: any): Promise<any>
    }
  }
  projectConfig: ProjectConfig
  mountVersion?: number
  debugData?: DebugData
  mode?: 'record' | 'studio'
}

type UploadCaptureArtifactResult = {
  success: boolean
  fileSize: number | bigint
  specAccess: ReturnType<AppCaptureProtocolInterface['getDbMetadata']>
  afterSpecDurations?: AfterSpecDurations
}

export type AfterSpecDurations = {
  drainCDPEvents?: number
  drainAUTEvents?: number
  resolveBodyPromises?: number
  closeDb?: number
  teardownBindings?: number
}

export interface ProtocolManagerShape extends AppCaptureProtocolCommon {
  isProtocolEnabled: boolean
  networkEnableOptions?: { maxTotalBufferSize: number, maxResourceBufferSize: number, maxPostDataSize: number }
  setupProtocol(): void
  prepareProtocol (script: string, options: ProtocolManagerOptions): Promise<void>
  prepareAndSetupProtocol (script: string, options: ProtocolManagerOptions): Promise<void>
  beforeSpec (spec: FoundSpec & { instanceId: string }): void
  afterSpec (): Promise<{ durations: AfterSpecDurations } | undefined>
  reportNonFatalErrors (clientMetadata: any): Promise<void>
  uploadCaptureArtifact(artifact: CaptureArtifact): Promise<UploadCaptureArtifactResult | undefined>
  connectToBrowser (cdpClient: CDPClient): Promise<void>
  close (): void
  dbPath?: string
}

type Response = {
  on (event: 'finish', cb: () => void): void
  on (event: 'close', cb: () => void): void
}

export type ResponseEndedWithEmptyBodyOptions = {
  requestId: string
  isCached: boolean
  timings: ProxyTimings
}

export type ResponseStreamOptions = {
  requestId: string
  responseHeaders: IncomingHttpHeaders
  isAlreadyGunzipped: boolean
  isAlreadyBrotliDecompressed?: boolean
  responseStream: Readable
  res: Response
  timings: ProxyTimings
}

export type ResponseStreamTimedOutOptions = {
  requestId: string
  timings: ProxyTimings
}

export type CyRequestBodyEncoding = 'utf8' | 'base64' | 'binary'

export type CyRequestInitiator = 'cy.request' | 'cy.session'

// Mirrors CDP's `redirectResponse` field on `Network.requestWillBeSent`. When a
// redirect chain is followed, the cypress side fires one cyRequestWillBeSent
// per hop (each sharing the same requestId); hops 2+ carry the prior hop's
// response here so downstream tooling sees the same shape as browser-issued
// redirect chains.
export type CyRequestRedirectResponse = {
  url: string
  status: number
  statusText: string
  headers: IncomingHttpHeaders
}

export type CyRequestWillBeSentOptions = {
  requestId: string
  runnableId?: string
  attempt?: number
  logId?: string
  url: string
  method: string
  requestHeaders: IncomingHttpHeaders
  // Full request body, untruncated. The capture-protocol applies the size cap
  // (cloud-tunable) before hashing — it's the source of truth for limits.
  requestBody?: Buffer | string
  requestBodyEncoding?: CyRequestBodyEncoding
  requestBodyOriginalSize?: number
  hasRequestBody: boolean
  initiator: CyRequestInitiator
  // Populated for hops 2+ in a redirect chain. Absent for the original request.
  redirectResponse?: CyRequestRedirectResponse
  timestamp: number
  wallTime: number
}

export type CyRequestResponseReceivedOptions = {
  requestId: string
  runnableId?: string
  attempt?: number
  logId?: string
  finalUrl: string
  status: number
  statusText: string
  responseHeaders: IncomingHttpHeaders
  // Untruncated response body stream — mirrors `responseStreamReceived` for CDP
  // traffic. The capture-protocol pipes this through a length-limited Transform
  // (cap is cloud-tunable) and then through `processAssetStream` for incremental
  // hashing and tarball persistence. Undefined when `hasResponseBody === false`.
  responseStream?: Readable
  // Bytes observed on the wire — the protocol uses this to decide whether to
  // truncate during streaming and to record `*Truncated` in the event payload.
  responseBodyOriginalSize?: number
  hasResponseBody: boolean
  durationMs: number
  attemptsUsed: number
  timestamp: number
}

export type CyRequestFailedOptions = {
  requestId: string
  runnableId?: string
  attempt?: number
  logId?: string
  errorMessage: string
  errorCode?: string
  durationMs: number
  attemptsUsed: number
  timestamp: number
}
