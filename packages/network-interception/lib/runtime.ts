import type { ProtocolManagerShape } from '@packages/types'

/**
 * Composition-root facade for the proxy-default network interception runtime.
 * Browser adapters swap in behind the same core in the HTTP/2 program.
 */
export interface NetworkInterceptionRuntime {
  handleHttpRequest (req: unknown, res: unknown): Promise<void>
  setProtocolManager (protocolManager?: ProtocolManagerShape): void
  reset (options?: { resetBetweenSpecs?: boolean }): void
  clearCredentials (): void
  addBrowserPreRequest (preRequest: unknown): Promise<void>
}
