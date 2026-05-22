import type {
  ForBrowserNetworkAutomation,
  ForCommandLog,
  ForCookieState,
  ForDocumentPreparation,
  ForNetworkCapture,
  ForRequestInterception,
  ForResponseInterception,
} from '../ports/driven-ports'
import type { BackendRoute } from '../types/backend-route'
import type { CyHttpMessages } from '../types/external-types'
import { mergeIncomingRequestChanges, type MergeIncomingRequestChangesOptions } from './merge-handler-result'
import { planSubscriptions, type PlanSubscriptionsOptions, type PlannedRouteSubscriptions } from './plan-subscriptions'
import { matchRoutes, matchesRoutePreflight, type RouteMatchableRequest } from './route-matching'

export type NetworkPolicyCoreOptions = {
  requestInterception?: ForRequestInterception
  responseInterception?: ForResponseInterception
  documentPreparation?: ForDocumentPreparation
  networkCapture?: ForNetworkCapture
  cookieState?: ForCookieState
  commandLog?: ForCommandLog
  browserNetworkAutomation?: ForBrowserNetworkAutomation
}

export type HandleInterceptRequestFn = (core: NetworkPolicyCore) => Promise<void>

/**
 * Orchestrates route matching, subscription planning, and handler merge logic.
 * Side-effectful proxy/driver I/O stays in net-stubbing adapters until Stage 4+.
 */
export class NetworkPolicyCore {
  constructor (private readonly options: NetworkPolicyCoreOptions = {}) {}

  matchRoutes (routes: BackendRoute[], req: RouteMatchableRequest): BackendRoute[] {
    return matchRoutes(routes, req)
  }

  matchesRoutePreflight (routes: BackendRoute[], req: RouteMatchableRequest): boolean {
    return matchesRoutePreflight(routes, req)
  }

  planSubscriptions (options: PlanSubscriptionsOptions): PlannedRouteSubscriptions[] {
    return planSubscriptions(options)
  }

  mergeIncomingRequestChanges (
    before: CyHttpMessages.IncomingRequest,
    after: CyHttpMessages.IncomingRequest,
    options: MergeIncomingRequestChangesOptions,
  ): string {
    return mergeIncomingRequestChanges(before, after, options)
  }

  /**
   * Stage 3b entry: middleware delegates here; execution is supplied by net-stubbing.
   */
  async handleRequest (run: HandleInterceptRequestFn): Promise<void> {
    return run(this)
  }

  async correlateBrowserPreRequest (ctx: unknown): Promise<void> {
    const port = this.options.requestInterception

    if (!port) {
      throw new Error('NetworkPolicyCore.requestInterception is not configured')
    }

    return port.correlateBrowserPreRequest(ctx)
  }

  /**
   * HTTP/2 bypass boundary — see {@link ForRequestInterception.forwardToOrigin}.
   */
  forwardToOrigin (ctx: unknown): void {
    const port = this.options.requestInterception

    if (!port) {
      throw new Error('NetworkPolicyCore.requestInterception is not configured')
    }

    return port.forwardToOrigin(ctx)
  }

  async interceptResponse (ctx: unknown): Promise<void> {
    const port = this.options.responseInterception

    if (!port) {
      throw new Error('NetworkPolicyCore.responseInterception is not configured')
    }

    return port.interceptResponse(ctx)
  }

  get requestInterception (): ForRequestInterception | undefined {
    return this.options.requestInterception
  }

  get responseInterception (): ForResponseInterception | undefined {
    return this.options.responseInterception
  }
}
