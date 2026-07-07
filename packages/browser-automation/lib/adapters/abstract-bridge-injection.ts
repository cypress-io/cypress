import type { ForAutBridgeInjection } from '../ports/driving-ports'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'
import AutInjectionScript from '@packages/injection'

/**
 * The `cypressConfig` the cross-origin spec-bridge expects (mirrors the proxy's cross-origin
 * injection options — packages/proxy/lib/http/util/inject.ts). Declared here so the package doesn't
 * have to reach into proxy types for a pass-through argument.
 */
export interface CrossOriginInjectionConfig {
  shouldInjectDocumentDomain: boolean
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  simulatedCookies: unknown[]
}

/**
 * Base for bridge-injection adapters. The document-context scaffolding comes from `@packages/injection`;
 * the runner sources are looked up here (resolve-dist) and serialized into the `injectAutBridge` call
 * — so the already-bundled runner code is shipped verbatim and eval'd in the document, and callers don't
 * need to know where the sources come from. Concrete adapters implement {@link inject} to ship the
 * assembled source over their transport.
 */
export abstract class AbstractBridgeInjection implements ForAutBridgeInjection {
  constructor (
    protected readonly documentDomainConfig: DocumentDomainInjectionConfig,
    protected readonly crossOriginConfig: CrossOriginInjectionConfig,
  ) {}

  abstract inject (primaryOrigin: string): Promise<void>

  /**
   * Assemble the injectable source: read the runner sources (resolve-dist), then wrap the scaffolding
   * bundle (an IIFE exposing `CypressInjection.injectAutBridge`) in a closure that calls it with the
   * primary origin, serialized config, runner sources, and cross-origin config. Everything is
   * `JSON.stringify`'d here in Node; the runner sources pass through verbatim, not run through a
   * bundler/minifier.
   *
   * `primaryOrigin` is passed FIRST to match `injectAutBridge`'s signature — the in-document bridge
   * compares each AUT frame's origin against it (a frame can't read `window.top.location`
   * cross-subdomain, so the origin is supplied here rather than read in the document).
   */
  protected async buildScript (primaryOrigin: string): Promise<string> {
    const [fullInjectionContents, crossOriginInjectionContents] = await Promise.all([
      getRunnerInjectionContents().then((contents) => contents.toString('utf8')),
      getRunnerCrossOriginInjectionContents().then((contents) => contents.toString('utf8')),
    ])

    return `;(function () {
  ${AutInjectionScript}
  CypressInjection.injectAutBridge(${JSON.stringify(primaryOrigin)}, ${JSON.stringify(this.documentDomainConfig)}, ${JSON.stringify(fullInjectionContents)}, ${JSON.stringify(this.crossOriginConfig)}, ${JSON.stringify(crossOriginInjectionContents)})
})();`
  }
}
