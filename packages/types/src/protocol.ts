import type { Database } from 'better-sqlite3'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

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
  addRunnables (runnables: any): void
  commandLogAdded (log: any): void
  commandLogChanged (log: any): void
  viewportChanged (input: any): void
  urlChanged (input: any): void
  beforeTest(test: Record<string, any>): void
  afterTest(test: Record<string, any>): void
  afterSpec (): Promise<void>
  connectToBrowser (cdpClient: CDPClient): Promise<void>
}

export interface AppCaptureProtocolInterface extends AppCaptureProtocolCommon {
  beforeSpec (db: Database): void
}

export interface ProtocolError {
  args?: any
  error: Error
  captureMethod: keyof AppCaptureProtocolInterface | 'setupProtocol' | 'uploadCaptureArtifact' | 'getCaptureProtocolScript' | 'cdpClient.on'
}

export interface ProtocolManagerShape extends AppCaptureProtocolCommon {
  setupProtocol(script: string, runId: string): Promise<void>
  beforeSpec (spec: { instanceId: string}): void
  sendErrors (errors: ProtocolError[]): Promise<void>
  uploadCaptureArtifact(uploadUrl: string): Promise<{ fileSize: number, success: boolean, error?: string } | void>
}
