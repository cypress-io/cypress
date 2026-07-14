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
  const injector = DocumentDomainInjection.InjectionBehavior(documentDomainConfig)

  try {
    // mirror the proxy's `partial` injection gate: only relax document.domain for documents on
    // the same superdomain as the primary origin — a cross-superdomain (third-party) frame is
    // left untouched, matching what the proxy pipeline injects today.
    if (injector.shouldInjectDocumentDomain(window.location.href) && injector.urlsMatch(window.location.href, primaryOrigin)) {
      const hostname = injector.getHostname(window.location.href)

      // about:blank and other non-http(s) documents have no hostname, and assigning '' throws.
      // Skipping loses nothing: this script runs once per document, so when the frame navigates
      // to a real URL, the new document gets its own pass and the assignment happens then.
      if (hostname) {
        window.document.domain = hostname
      }
    }
  } catch (e) {
    // swallow: a document.domain failure must not abort level resolution + injection below
  }

  // deliberately NOT wrapped in try/catch: a bridge-install failure is fatal for the AUT frame,
  // so let it surface loudly rather than silently producing a frame without window.Cypress
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
}
