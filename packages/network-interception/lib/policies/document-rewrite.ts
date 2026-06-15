import type { NetworkPolicy } from './types'

export type DocumentRewriteConfig = {
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
}

/**
 * Configurator policy: document rewrite / framebusting flags from Cypress config.
 * Registered at startup; {@link resolveWantsSecurityRemoved} consumes equivalent facts at runtime.
 */
export function DocumentRewrite (config: DocumentRewriteConfig): NetworkPolicy {
  const enabled = !!(config.modifyObstructiveCode || config.experimentalModifyObstructiveThirdPartyCode)

  return {
    name: 'document-rewrite',
    provenance: 'config',
    phases: ['response'],
    when () {
      return enabled
    },
    apply (ctx) {
      ctx.continue()
    },
  }
}
