import type { Database } from 'better-sqlite3'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

type Commands = ProtocolMapping.Commands
type Command<T extends keyof Commands> = Commands[T]
type Events = ProtocolMapping.Events
type Event<T extends keyof Events> = Events[T]

interface CDPClient {
  send<T extends Extract<keyof Commands, string>> (command: T, params?: Command<T>['paramsType'][0]): Promise<Command<T>['returnType']>
  on<T extends Extract<keyof Events, string>> (eventName: T, cb: (event: Event<T>[0]) => void): void
}

// TODO(protocol): This is basic for now but will evolve as we progress with the protocol work

export interface AppCaptureProtocolInterface {
  addRunnables (runnables: any): Promise<void>
  connectToBrowser (cdpClient: CDPClient): void
  beforeSpec (db: Database): void
  afterSpec (): void
  beforeTest(test: Record<string, any>): void
  afterTest(test: Record<string, any>): void
  close (): void
}

export interface ProtocolManager {
  setupProtocol(url?: string): Promise<void>
  protocolEnabled(): boolean
  addRunnables (runnables: any): Promise<void>
  connectToBrowser (cdpClient: CDPClient): void
  beforeSpec (spec: { instanceId: string}): void
  afterSpec (): void
  beforeTest(test: Record<string, any>): void
  afterTest(test: Record<string, any>): void
  close (): void
}
