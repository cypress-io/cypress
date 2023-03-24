import type { SpecFile } from '.'

// TODO(protocol): This is basic for now but will evolve as we progress with the protocol work

export interface AppCaptureProtocolInterface {
  addRunnables (runnables: any): void
  connectToBrowser (options: { target: string, host: string, port: number }): Promise<void>
  beforeSpec (spec: SpecFile & { instanceId: string }): void
  afterSpec (): void
  beforeTest(test: { id: string, attempt: number, timestamp: number }): void
  afterTest(test: { id: string, attempt: number, wallClockDuration: number, timestamp: number }): void
  close(): void
}

export interface ProtocolManager extends AppCaptureProtocolInterface {
  setupProtocol(url?: string): Promise<void>
  protocolEnabled(): boolean
}
