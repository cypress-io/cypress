import type { NetworkPolicy } from '@packages/network-interception'

type BlockedHostsConfig = {
  blockHosts?: string | string[] | null
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
      ctx.end()
    },
  }
}
