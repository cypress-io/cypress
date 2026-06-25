import { AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'
import { installAutBridgeInFrame } from './install-aut-bridge-in-frame'
import { buildDocumentDomainInjection } from './build-document-domain-injection'
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
 * Page-context entry. The full / cross-origin runner sources are passed in as strings (read from
 * disk on the Node side) and eval'd here. These are proxy-injection templates, so we reproduce the
 * context the proxy gives them: `document.domain` for the full source, and the `cypressConfig` IIFE
 * wrapper for the cross-origin spec-bridge.
 */
export function injectAutBridge (
  documentDomainConfig: DocumentDomainInjectionConfig,
  fullInjectionContents: string,
  crossOriginInjectionConfig: CrossOriginInjectionConfig,
  crossOriginInjectionContents: string,
) {
  try {
    installAutBridgeInFrame(window, AUT_FRAME_NAME_IDENTIFIER, {
      onFull () {
        buildDocumentDomainInjection(documentDomainConfig)
        // boot window.Cypress in the AUT frame
        // eslint-disable-next-line no-eval
        eval(fullInjectionContents)
      },
      onCrossOrigin () {
        buildDocumentDomainInjection(documentDomainConfig)
        // the cross-origin spec-bridge references `cypressConfig` — supply it exactly as the proxy
        // does (inject.ts fullCrossOrigin): wrap the contents in an IIFE that passes the config in.
        // eslint-disable-next-line no-eval
        eval(`(function (cypressConfig) {\n${crossOriginInjectionContents}\n}(${JSON.stringify(crossOriginInjectionConfig)}))`)
      },
      onPartial () {
        buildDocumentDomainInjection(documentDomainConfig)
      },
    })
  } catch (e) {
    // swallow so a bridge failure never breaks the AUT document
  }
}
