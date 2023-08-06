import type { Database } from 'better-sqlite3'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { IncomingHttpHeaders } from 'http'
import type { Readable } from 'stream'

type Commands = ProtocolMapping.Commands
type Command<T extends keyof Commands> = Commands[T]
type Events = ProtocolMapping.Events
type Event<T extends keyof Events> = Events[T]

export interface CDPClient {
  send<T extends Extract<keyof Commands, string>> (command: T, params?: Command<T>['paramsType'][0]): Promise<Command<T>['returnType']>
  on<T extends Extract<keyof Events, string>> (eventName: T, cb: (event: Event<T>[0]) => void): void
}

// TODO(protocol): This is basic for now but will evolve as we progress with the protocol work

export interface AppCaptureProtocolCommon {
  getDbMetadata (): { offset: number, size: number } | undefined
  addRunnables (runnables: any): void
  commandLogAdded (log: any): void
  commandLogChanged (log: any): void
  viewportChanged (input: any): void
  urlChanged (input: any): void
  beforeTest(test: Record<string, any>): Promise<void>
  afterTest(test: Record<string, any>): Promise<void>
  afterSpec (): Promise<void>
  connectToBrowser (cdpClient: CDPClient): Promise<void>
  pageLoading (input: any): void
  resetTest (testId: string): void
  responseStreamReceived (options: ResponseStreamOptions): Readable | undefined
}

export interface AppCaptureProtocolInterface extends AppCaptureProtocolCommon {
  beforeSpec ({ workingDirectory, archivePath, dbPath, db }: { workingDirectory: string, archivePath: string, dbPath: string, db: Database }): void
}

export interface ProtocolError {
  args?: any
  error: Error
  captureMethod: keyof AppCaptureProtocolInterface | 'setupProtocol' | 'uploadCaptureArtifact' | 'getCaptureProtocolScript' | 'cdpClient.on'
}

export interface ProtocolManagerShape extends AppCaptureProtocolCommon {
  protocolEnabled: boolean
  setupProtocol(script: string, runId: string): Promise<void>
  beforeSpec (spec: { instanceId: string}): void
  sendErrors (errors: ProtocolError[]): Promise<void>
  uploadCaptureArtifact(options: { uploadUrl: string, timeout: number }): Promise<{ fileSize: number, success: boolean, error?: string } | void>
}

type Response = {
  on (event: 'finish', cb: () => void): void
  on (event: 'close', cb: () => void): void
}

export type ResponseStreamOptions = {
  requestId: string
  responseHeaders: IncomingHttpHeaders
  isAlreadyGunzipped: boolean
  responseStream: Readable
  res: Response
}
