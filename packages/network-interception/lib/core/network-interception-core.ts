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
import { mergeIncomingRequestChanges } from './merge-handler-result'
import type { MergeIncomingRequestChangesOptions } from './merge-handler-result'
import { planSubscriptions } from './plan-subscriptions'
import type { PlanSubscriptionsOptions, PlannedRouteSubscriptions } from './plan-subscriptions'
import { matchRoutes, matchesRoutePreflight } from './route-matching'
import type { RouteMatchableRequest } from './route-matching'

export type NetworkInterceptionCoreOptions = {
  requestInterception?: ForRequestInterception
  responseInterception?: ForResponseInterception
  documentPreparation?: ForDocumentPreparation
  networkCapture?: ForNetworkCapture
  cookieState?: ForCookieState
  commandLog?: ForCommandLog
  browserNetworkAutomation?: ForBrowserNetworkAutomation
}

export type HandleInterceptRequestFn = (core: NetworkInterceptionCore) => Promise<void>

/**
 * Orchestrates route matching, subscription planning, and handler merge logic.
 * Side-effectful proxy/driver I/O stays in net-stubbing adapters until Stage 4+.
 */
export class NetworkInterceptionCore {
  constructor (private readonly options: NetworkInterceptionCoreOptions = {}) {}

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

  get requestInterception (): ForRequestInterception | undefined {
    return this.options.requestInterception
  }

  get responseInterception (): ForResponseInterception | undefined {
    return this.options.responseInterception
  }
}
