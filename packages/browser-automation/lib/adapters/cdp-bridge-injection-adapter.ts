import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'
import { AbstractBridgeInjection } from './abstract-bridge-injection'
import type { CrossOriginInjectionConfig } from './abstract-bridge-injection'

/**
 * Minimal CDP send signature this adapter needs. NOTE: duplicated. @packages/server/lib/browsers/cdp_automation.ts.SendDebuggerCommand. Defined locally so the package
 * stays free of any `@packages/server` dependency (the real client is passed by
 * reference at construction).
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
 * - Register-ONCE per AUT page lifecycle: registering on every frame event would
 *   stack N persistent scripts and install the bridge N times.
 * - The page-context script comes from `@packages/injection`; this adapter is pure
 *   CDP transport.
 */
export class CdpBridgeInjectionAdapter extends AbstractBridgeInjection {
  private scriptIdentifier?: Protocol.Page.ScriptIdentifier

  constructor (
    private readonly send: SendCdpCommand,
    documentDomainConfig: DocumentDomainInjectionConfig,
    crossOriginConfig: CrossOriginInjectionConfig,
  ) {
    super(documentDomainConfig, crossOriginConfig)
  }

  /**
   * Register the bridge on the AUT target. Should be called as the AUT frame
   * attaches (while still `about:blank`, before `cy.visit` navigates) so the
   * script is in place before the first document commits.
   */
  async inject (): Promise<void> {
    // register-once
    if (this.scriptIdentifier) {
      return
    }

    const source = await this.buildScript()

    const { identifier } = await this.send('Page.addScriptToEvaluateOnNewDocument', { source })

    this.scriptIdentifier = identifier
  }
}
