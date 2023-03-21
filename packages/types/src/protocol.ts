import type { SpecFile } from '.'

// TODO(protocol): This is basic for now but will evolve as we progress with the protocol work

export interface AppCaptureProtocolInterface {
  addRunnables (runnables: any): void
  connectToBrowser (options: { target: string, host: string, port: number }): void
  beforeSpec (spec: SpecFile & { instanceId: string }): void
  afterSpec (): void
  beforeTest (test: { id: string, title: string, wallClockStartedAt: number }): void
}

export interface ProtocolManager extends AppCaptureProtocolInterface {
  setupProtocol(url?: string): Promise<void>
  protocolEnabled(): boolean
}
