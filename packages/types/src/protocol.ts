// TODO: This is basic for now but will evolve as we progress with the protocol work

export interface ProtocolManager {
  setupProtocol(url?: string): Promise<void>
  protocolEnabled(): boolean
  connectToBrowser(options: any): void
  beforeSpec(spec: any): void
  afterSpec(): void
  beforeTest(test: any): void
}
