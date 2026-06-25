import { DocumentDomainInjection } from '@packages/network-tools'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'

export const buildDocumentDomainInjection = (config: DocumentDomainInjectionConfig): void => {
  const injectionBehavior = DocumentDomainInjection.InjectionBehavior(config)

  if (injectionBehavior.shouldInjectDocumentDomain(window.location.href)) {
    window.document.domain = injectionBehavior.getHostname(window.location.href)
  }
}
