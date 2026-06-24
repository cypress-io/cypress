import _ from 'lodash'
import type {
  BackendRoute,
  BackendStaticResponse,
  HttpRequest,
  HttpResponse,
  Subscription,
} from '@packages/network-interception'
import type { PlannedRouteSubscriptions } from './plan-subscriptions'

export type InFlightIntercept = {
  request: HttpRequest
  matchingRoutes: BackendRoute[]
  subscriptionsByRoute: PlannedRouteSubscriptions[]
  lastEvent?: string
  includeBodyInAfterResponse: boolean
  fulfilledAtRequestStage: boolean
  stubResponse?: HttpResponse
  responseOverride?: HttpResponse
  forceNetworkError?: boolean
  inFlightEventId?: string
}

export function createInFlightIntercept (
  request: HttpRequest,
  matchingRoutes: BackendRoute[],
  subscriptionsByRoute: PlannedRouteSubscriptions[],
): InFlightIntercept {
  return {
    request,
    matchingRoutes,
    subscriptionsByRoute,
    includeBodyInAfterResponse: false,
    fulfilledAtRequestStage: false,
  }
}

export function addInFlightInterceptSubscription (
  inFlightIntercept: InFlightIntercept,
  subscription: Subscription,
): void {
  const subscriptionsByRoute = _.find(inFlightIntercept.subscriptionsByRoute, { routeId: subscription.routeId })

  if (!subscriptionsByRoute) {
    throw new Error('expected to find existing subscriptions for route, but request did not originally match route')
  }

  const defaultSub = _.find(subscriptionsByRoute.subscriptions, ({ eventName, routeId, id, skip }) => {
    return eventName === subscription.eventName && routeId === subscription.routeId && !id && !skip
  })

  defaultSub && (defaultSub.skip = true)

  subscriptionsByRoute.subscriptions.push(subscription)
}

export function markInFlightInterceptStaticResponse (
  inFlightIntercept: InFlightIntercept,
  staticResponse: BackendStaticResponse,
  response: HttpResponse,
): void {
  if (staticResponse.fixture && ['before:response', 'response:callback', 'response'].includes(inFlightIntercept.lastEvent!)) {
    inFlightIntercept.includeBodyInAfterResponse = true
  }

  inFlightIntercept.fulfilledAtRequestStage = true
  inFlightIntercept.stubResponse = response

  if (staticResponse.forceNetworkError) {
    inFlightIntercept.forceNetworkError = true
  }
}
