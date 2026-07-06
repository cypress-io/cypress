import { installAutBridgeInFrame } from './install-aut-bridge-in-frame'
import { DocumentDomainInjection } from '@packages/network-tools'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'

/**
 * The `cypressConfig` the cross-origin spec-bridge expects in scope. Mirrors the proxy's
 * cross-origin injection options (packages/proxy/lib/http/util/inject.ts).
 */
export interface CrossOriginInjectionConfig {
  shouldInjectDocumentDomain: boolean
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  simulatedCookies: unknown[]
}

/**
 * document-context entry. The full / cross-origin runner injection contents are passed in as strings (read from
 * disk on the Node side) and eval'd here.
 *
 * `primaryOrigin` is the top/primary origin as known on the Node side (the same superdomain fact
 * the server-side `resolveInjectionLevel` uses). It's supplied as an argument because a frame can't
 * read `window.top.location` cross-subdomain under web security — see `installAutBridgeInFrame`.
 */
export function injectAutBridge (
  primaryOrigin: string,
  documentDomainConfig: DocumentDomainInjectionConfig,
  fullInjectionContents: string,
  crossOriginInjectionConfig: CrossOriginInjectionConfig,
  crossOriginInjectionContents: string,
) {
  try {
    const injector = DocumentDomainInjection.InjectionBehavior(documentDomainConfig)

    if (injector.shouldInjectDocumentDomain(window.location.href)) {
      window.document.domain = injector.getHostname(window.location.href)
    }

    installAutBridgeInFrame(window, injector, primaryOrigin, {
      onFull () {
        // boot window.Cypress in the AUT frame
        // eslint-disable-next-line no-eval
        eval(fullInjectionContents)
      },
      onCrossOrigin () {
        // the cross-origin spec-bridge references `cypressConfig` — supply it exactly as the proxy
        // does (inject.ts fullCrossOrigin): wrap the contents in an IIFE that passes the config in.
        // eslint-disable-next-line no-eval
        eval(`(function (cypressConfig) {\n${crossOriginInjectionContents}\n}(${JSON.stringify(crossOriginInjectionConfig)}))`)
      },
    })
  } catch (e) {
    // swallow so a bridge failure never breaks the AUT document
  }
}
