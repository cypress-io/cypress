// TODO: This is basic for now but will evolve as we progress with the protocol work

export interface ProtocolManager {
  connectToBrowser(options: any): void
  beforeSpec(spec: any): void
  afterSpec(): void
  beforeTest(attr: any, test: any): void
}
