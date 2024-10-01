import type { Database } from 'better-sqlite3'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { IncomingHttpHeaders } from 'http'
import type { Readable } from 'stream'
import type { ProxyTimings } from './proxy'
import type { SpecWithRelativeRoot } from './spec'

type Commands = ProtocolMapping.Commands
type Command<T extends keyof Commands> = Commands[T]
type Events = ProtocolMapping.Events
type Event<T extends keyof Events> = Events[T]

export interface CDPClient {
  send<T extends Extract<keyof Commands, string>> (command: T, params?: Command<T>['paramsType'][0]): Promise<Command<T>['returnType']>
  on<T extends Extract<keyof Events, string>> (eventName: T, cb: (event: Event<T>[0]) => void): void
  off (eventName: string, cb: (event: any) => void): void
}

// TODO(protocol): This is basic for now but will evolve as we progress with the protocol work

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
  connectToBrowser (cdpClient: CDPClient): Promise<void>
  pageLoading (input: any): void
  resetTest (testId: string): void
  responseEndedWithEmptyBody: (options: ResponseEndedWithEmptyBodyOptions) => void
  responseStreamReceived (options: ResponseStreamOptions): Readable | undefined
  responseStreamTimedOut (options: ResponseStreamTimedOutOptions): void
}

export interface AppCaptureProtocolInterface extends AppCaptureProtocolCommon {
  getDbMetadata (): { offset: number, size: number } | undefined
  beforeSpec ({ spec, workingDirectory, archivePath, dbPath, db }: { spec: SpecWithRelativeRoot & { instanceId: string }, workingDirectory: string, archivePath: string, dbPath: string, db: Database }): void
  uploadStallSamplingInterval: () => number
}

export type ProtocolCaptureMethod = keyof AppCaptureProtocolInterface | 'setupProtocol' | 'uploadCaptureArtifact' | 'getCaptureProtocolScript' | 'cdpClient.on' | 'getZippedDb' | 'UNKNOWN' | 'createProtocolArtifact' | 'protocolUploadUrl'

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

export type ProtocolManagerOptions = {
  runId: string
  testingType: 'e2e' | 'component'
  projectId: string
  cloudApi: {
    url: string
    retryWithBackoff (fn: (attemptIndex: number) => Promise<any>): Promise<any>
    requestPromise: {
      get (options: any): Promise<any>
    }
  }
  mountVersion?: number
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
  protocolEnabled: boolean
  networkEnableOptions?: { maxTotalBufferSize: number, maxResourceBufferSize: number, maxPostDataSize: number }
  setupProtocol(script: string, options: ProtocolManagerOptions): Promise<void>
  beforeSpec (spec: SpecWithRelativeRoot & { instanceId: string }): void
  afterSpec (): Promise<{ durations: AfterSpecDurations } | undefined>
  reportNonFatalErrors (clientMetadata: any): Promise<void>
  uploadCaptureArtifact(artifact: CaptureArtifact): Promise<UploadCaptureArtifactResult | void>

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
  responseStream: Readable
  res: Response
  timings: ProxyTimings
}

export type ResponseStreamTimedOutOptions = {
  requestId: string
  timings: ProxyTimings
}
