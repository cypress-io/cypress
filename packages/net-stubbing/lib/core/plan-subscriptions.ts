import type { BackendStaticResponse, BackendRoute, Subscription } from '@packages/network-interception'

export type PlannedRouteSubscriptions = {
  routeId: string
  immediateStaticResponse?: BackendStaticResponse
  subscriptions: Subscription[]
}

type PlanSubscriptionsOptions = {
  matchingRoutes: BackendRoute[]
  isSyncRequest?: boolean
  url?: string
  onSyncInterceptSkipped?: (url: string) => void
}

const DEFAULT_NOTIFICATION_EVENTS = Object.freeze(['response:callback', 'after:response', 'network:error']) as readonly ['response:callback', 'after:response', 'network:error']

/**
 * Pure subscription plan for matched intercept routes (from `InterceptedRequest.addDefaultSubscriptions`).
 */
export function planSubscriptions (options: PlanSubscriptionsOptions): PlannedRouteSubscriptions[] {
  const { matchingRoutes, isSyncRequest, url, onSyncInterceptSkipped } = options
  const planned: PlannedRouteSubscriptions[] = []

  for (const route of matchingRoutes) {
    if (route.disabled) {
      continue
    }

    if (isSyncRequest && route.hasInterceptor) {
      if (url) {
        onSyncInterceptSkipped?.(url)
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
