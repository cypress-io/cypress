import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'
import { DocumentDomainInjection } from '@packages/network-tools'
import { AbstractBridgeInjection } from './abstract-bridge-injection'
import type { CrossOriginInjectionConfig } from './abstract-bridge-injection'

/**
 * Minimal CDP send signature this adapter needs. NOTE: duplicated from
 * @packages/server/lib/browsers/cdp_automation.ts.SendDebuggerCommand. Defined locally so the package
 * stays free of any `@packages/server` dependency (the real client is passed by reference at
 * construction).
 */
export type SendCdpCommand = <T extends keyof ProtocolMapping.Commands>(
  command: T,
  params?: ProtocolMapping.Commands[T]['paramsType'][0],
) => Promise<ProtocolMapping.Commands[T]['returnType']>

/**
 * Installs the Cypress bridge (`window.Cypress`) into the AUT via CDP, for the
 * HTTP/2 / proxy-bypass path where the proxy is no longer on the AUT traffic path
 * to rewrite HTML.
 *
 * Design (see issue #33849):
 * - Uses `Page.addScriptToEvaluateOnNewDocument` so the bridge runs before any
 *   application script and survives `cy.reload()` / same-tab navigations for free.
 * - That API is per-TARGET and runs in EVERY frame, so the registered source
 *   self-guards on `window.name` and only initializes in the AUT frame (the
 *   runner's own top frame and child frames no-op).
 * - The document-context bridge bakes the **primary origin** in as a constant (a
 *   cross-subdomain AUT frame can't read `window.top.location` under web security).
 *   When the top frame navigates to a new origin, the baked-in value is stale for
 *   future documents, so {@link inject} detaches the old script
 *   (`Page.removeScriptToEvaluateOnNewDocument`) and re-registers with the new origin.
 * - Re-registration is keyed on the injector-reduced origin, so same-origin
 *   navigations (and same-superdomain subdomain hops when document.domain injection
 *   is on) don't churn the script.
 * - The document-context script comes from `@packages/injection`; this adapter is pure
 *   CDP transport + lifecycle.
 */
export class CdpBridgeInjectionAdapter extends AbstractBridgeInjection {
  private scriptIdentifier?: Protocol.Page.ScriptIdentifier
  private injectedOriginKey?: string
  private readonly injector: DocumentDomainInjection

  constructor (
    private readonly send: SendCdpCommand,
    documentDomainConfig: DocumentDomainInjectionConfig,
    crossOriginConfig: CrossOriginInjectionConfig,
  ) {
    super(documentDomainConfig, crossOriginConfig)
    // reduce the top url to the same origin key the in-document bridge compares against, so we only
    // re-register when the primary origin actually changes (not on same-origin path navigations).
    this.injector = DocumentDomainInjection.InjectionBehavior(documentDomainConfig)
  }

  /**
   * Register (or re-register) the bridge for `primaryOrigin`. Idempotent per (reduced) origin:
   * a no-op when already registered for it, and a detach + re-attach when it changes. Throws if
   * `primaryOrigin` can't be parsed.
   */
  async inject (primaryOrigin: string): Promise<void> {
    let originKey: string

    try {
      originKey = this.injector.getOrigin(primaryOrigin)
    } catch (err) {
      // without a parseable primary origin we can't anchor an injection-level decision; fail loudly
      // rather than silently leaving the AUT frame without a bridge.
      throw new Error(`Could not resolve the primary origin for AUT bridge injection from "${primaryOrigin}": ${err}`)
    }

    // already registered for this origin — nothing to do
    if (this.scriptIdentifier && this.injectedOriginKey === originKey) {
      return
    }

    // detach the stale script before re-registering with the new primary origin
    if (this.scriptIdentifier) {
      await this.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: this.scriptIdentifier })
      this.scriptIdentifier = undefined
    }

    const source = await this.buildScript(primaryOrigin)

    const { identifier } = await this.send('Page.addScriptToEvaluateOnNewDocument', { source })

    this.scriptIdentifier = identifier
    this.injectedOriginKey = originKey
  }
}
