import type { BackendStaticResponse } from '../types/internal-types'
import type { Subscription } from '../types/external-types'
import type { BackendRoute } from '../types/backend-route'

export type PlannedRouteSubscriptions = {
  routeId: string
  immediateStaticResponse?: BackendStaticResponse
  subscriptions: Subscription[]
}

export type PlanSubscriptionsOptions = {
  matchingRoutes: BackendRoute[]
  isSyncRequest?: boolean
  proxiedUrl?: string
  onSyncInterceptSkipped?: (proxiedUrl: string) => void
}

const DEFAULT_NOTIFICATION_EVENTS = Object.freeze(['response:callback', 'after:response', 'network:error']) as readonly ['response:callback', 'after:response', 'network:error']

/**
 * Pure subscription plan for matched intercept routes (from `InterceptedRequest.addDefaultSubscriptions`).
 */
export function planSubscriptions (options: PlanSubscriptionsOptions): PlannedRouteSubscriptions[] {
  const { matchingRoutes, isSyncRequest, proxiedUrl, onSyncInterceptSkipped } = options
  const planned: PlannedRouteSubscriptions[] = []

  for (const route of matchingRoutes) {
    if (route.disabled) {
      continue
    }

    if (isSyncRequest && route.hasInterceptor) {
      if (proxiedUrl) {
        onSyncInterceptSkipped?.(proxiedUrl)
      }

      continue
    }

    planned.push({
      routeId: route.id,
      immediateStaticResponse: route.staticResponse,
      subscriptions: [{
        eventName: 'before:request',
        await: !!route.hasInterceptor,
        routeId: route.id,
      },
      ...DEFAULT_NOTIFICATION_EVENTS.map((eventName) => {
        return {
          eventName,
          await: false,
          routeId: route.id,
        }
      })],
    })
  }

  return planned
}
