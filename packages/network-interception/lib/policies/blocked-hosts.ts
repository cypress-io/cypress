import type { NetworkPolicy } from './types'

export type BlockedHostsConfig = {
  /**
   * Live config object shared with the proxy runtime.
   * `blockHosts` is read at enforcement time, not snapshot at registration.
   */
  config: { blockHosts?: string | string[] | null }
  /**
   * Host matcher injected by the composition root (e.g. `blocked.matches` from proxy).
   * Keeps `@packages/network-interception` free of proxy dependencies.
   */
  matchesBlockedHost?: (url: string, blockHosts: string | string[]) => string | false | null | undefined
}

export function createBlockedHosts (config: BlockedHostsConfig): NetworkPolicy {
  return {
    name: 'blocked-hosts',
    provenance: 'config',
    phases: ['request'],
    when (exchange) {
      const blockHosts = config.config.blockHosts

      if (!blockHosts || !config.matchesBlockedHost || !exchange.url) {
        return false
      }

      return !!config.matchesBlockedHost(exchange.url, blockHosts)
    },
    apply (ctx) {
      const blockHosts = config.config.blockHosts

      if (!blockHosts || !config.matchesBlockedHost || !ctx.exchange.url) {
        return
      }

      const match = config.matchesBlockedHost(ctx.exchange.url, blockHosts)

      if (!match) {
        return
      }

      ctx.state.blockedHostMatch = match
      ctx.end()
    },
  }
}
