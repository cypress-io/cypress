import type { SpecFile } from '.'

// TODO: This is basic for now but will evolve as we progress with the protocol work

export interface ProtocolManager {
  setupProtocol(url?: string): Promise<void>
  protocolEnabled(): boolean
  connectToBrowser(options: { target: string, host: number, port: number }): void
  beforeSpec(spec: SpecFile & { instanceId: string }): void
  afterSpec(): void
  beforeTest(test: { id: string, title: string, wallClockStartedAt: number }): void
}
