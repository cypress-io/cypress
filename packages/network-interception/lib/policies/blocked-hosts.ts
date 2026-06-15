import type { NetworkPolicy } from './types'

export type BlockedHostsConfig = {
  blockHosts?: string | string[] | null
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
      if (!config.blockHosts || !config.matchesBlockedHost || !exchange.url) {
        return false
      }

      return !!config.matchesBlockedHost(exchange.url, config.blockHosts)
    },
    apply (ctx) {
      const match = config.matchesBlockedHost!(ctx.exchange.url!, config.blockHosts!)

      ctx.state.blockedHostMatch = match
      ctx.end()
    },
  }
}
