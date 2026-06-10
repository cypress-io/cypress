import type { NetworkPolicy } from './types'

export type CspAllowListConfig = {
  experimentalCspAllowList?: boolean | string[] | null
}

/**
 * Configurator policy: CSP directive allow-list from `experimentalCspAllowList`.
 * Registered at startup; enforcement remains in proxy response middleware until fully wired.
 */
export function CspAllowList (config: CspAllowListConfig): NetworkPolicy {
  return {
    name: 'csp-allow-list',
    provenance: 'config',
    phases: ['response'],
    when () {
      return !!config.experimentalCspAllowList
    },
    apply (ctx) {
      ctx.continue()
    },
  }
}
