import type {
  ForCommandLog,
  ForCookieState,
  ForDocumentPreparation,
  ForNetworkCapture,
} from '../ports/driven-ports'
import type { ForNetworkPolicyRegistration } from '../ports/driving-ports'
import type { NetworkExchange } from '../exchange/network-exchange'

export type NetworkInterceptionCoreOptions = {
  policyRegistration?: ForNetworkPolicyRegistration
  documentPreparation?: ForDocumentPreparation
  networkCapture?: ForNetworkCapture
  cookieState?: ForCookieState
  commandLog?: ForCommandLog
}

/**
 * Proxy-side facade for network driven ports (cookies, injection, policies, capture).
 * Per-request `cy.intercept` orchestration lives in {@link HttpInterception}.
 */
export class NetworkInterceptionCore {
  constructor (private readonly options: NetworkInterceptionCoreOptions = {}) {}

  private buildRequestExchange (ctx: unknown): NetworkExchange {
    const mw = ctx as { req: { proxiedUrl?: string, method?: string, requestId?: string } }

    return {
      url: mw.req.proxiedUrl,
      method: mw.req.method,
      requestId: mw.req.requestId,
    }
  }

  runRequestPolicies (ctx: unknown) {
    const registration = this.options.policyRegistration

    if (!registration) {
      throw new Error('NetworkInterceptionCore.policyRegistration is not configured')
    }

    return registration.runPolicies({
      phase: 'request',
      exchange: this.buildRequestExchange(ctx),
    })
  }

  async setInjectionLevel (ctx: unknown): Promise<void> {
    const port = this.options.documentPreparation

    if (!port) {
      throw new Error('NetworkInterceptionCore.documentPreparation is not configured')
    }

    return port.setInjectionLevel(ctx)
  }

  async injectHtml (ctx: unknown): Promise<void> {
    const port = this.options.documentPreparation

    if (!port) {
      throw new Error('NetworkInterceptionCore.documentPreparation is not configured')
    }

    return port.injectHtml(ctx)
  }

  async removeSecurity (ctx: unknown): Promise<void> {
    const port = this.options.documentPreparation

    if (!port) {
      throw new Error('NetworkInterceptionCore.documentPreparation is not configured')
    }

    return port.removeSecurity(ctx)
  }

  notifyIncomingRequest (ctx: unknown): void {
    const port = this.options.commandLog

    if (!port) {
      throw new Error('NetworkInterceptionCore.commandLog is not configured')
    }

    return port.notifyIncomingRequest(ctx)
  }

  async attachCrossOriginCookies (ctx: unknown): Promise<void> {
    const port = this.options.cookieState

    if (!port) {
      throw new Error('NetworkInterceptionCore.cookieState is not configured')
    }

    return port.attachCrossOriginCookies(ctx)
  }

  async copyCookiesFromResponse (ctx: unknown): Promise<void> {
    const port = this.options.cookieState

    if (!port) {
      throw new Error('NetworkInterceptionCore.cookieState is not configured')
    }

    return port.copyCookiesFromResponse(ctx)
  }

  async notifyResponseStreamReceived (ctx: unknown): Promise<void> {
    const port = this.options.networkCapture

    if (!port) {
      throw new Error('NetworkInterceptionCore.networkCapture is not configured')
    }

    return port.notifyResponseStreamReceived(ctx)
  }

  notifyResponseEndedWithEmptyBody (ctx: unknown, options: { isCached: boolean }): void {
    const port = this.options.networkCapture

    if (!port) {
      throw new Error('NetworkInterceptionCore.networkCapture is not configured')
    }

    return port.notifyResponseEndedWithEmptyBody(ctx, options)
  }

  get documentPreparation (): ForDocumentPreparation | undefined {
    return this.options.documentPreparation
  }

  get networkCapture (): ForNetworkCapture | undefined {
    return this.options.networkCapture
  }

  get cookieState (): ForCookieState | undefined {
    return this.options.cookieState
  }

  get commandLog (): ForCommandLog | undefined {
    return this.options.commandLog
  }
}
