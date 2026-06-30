import _ from 'lodash'
import type { ForDriverNotification, InterceptHandlerEventName, NetEvent, Subscription } from '@packages/network-interception'
import type { InFlightIntercept } from './in-flight-intercept'
import { markInFlightInterceptStaticResponse } from './in-flight-intercept'
import { buildHttpResponseFromStatic } from './static-response'

type RunSubscriptionsOptions<D> = {
  inFlightIntercept: InFlightIntercept
  eventName: InterceptHandlerEventName | InterceptHandlerEventName[]
  data: D
  mergeChanges: (before: D, after: D) => void
  driverNotification: ForDriverNotification
}

/**
 * Run ordered intercept subscriptions for one or more event names on an in-flight intercept.
 */
export async function runSubscriptions<D> (options: RunSubscriptionsOptions<D>): Promise<D> {
  const { inFlightIntercept, eventName, data, mergeChanges, driverNotification } = options
  const eventNames = Array.isArray(eventName) ? eventName : [eventName]
  let stopPropagationNow
  let abortSubscriptions = false

  outerLoop: for (const currentEventName of eventNames) {
    inFlightIntercept.lastEvent = currentEventName

    const shouldStopSubscriptions = () => {
      return abortSubscriptions
        || stopPropagationNow
        || inFlightIntercept.responseOverride
        || inFlightIntercept.forceNetworkError
        || (currentEventName === 'before:request' && inFlightIntercept.fulfilledAtRequestStage)
    }

    const handleSubscription = async (subscription: Subscription): Promise<boolean> => {
      if (subscription.skip || subscription.eventName !== currentEventName) {
        return false
      }

      const eventId = _.uniqueId('event')
      const eventFrame: NetEvent.ToDriver.Event<any> = {
        eventId,
        subscription,
        browserRequestId: inFlightIntercept.request.browserRequestId,
        requestId: inFlightIntercept.request.inFlightInterceptId,
        data,
      }

      if (currentEventName === 'before:request') {
        const route = inFlightIntercept.matchingRoutes.find(({ id }) => id === subscription.routeId)

        if (!route) {
          throw new Error(`No route by ID ${subscription.routeId} for ${currentEventName}`)
        }

        route.matches++

        if (route.routeMatcher.times && route.matches >= route.routeMatcher.times) {
          route.disabled = true
        }
      }

      if (!subscription.await) {
        driverNotification.emit(currentEventName, eventFrame)

        return true
      }

      inFlightIntercept.inFlightEventId = eventId

      const result = await driverNotification.emitAndAwait(currentEventName, eventFrame)

      delete inFlightIntercept.inFlightEventId

      if (inFlightIntercept.fulfilledAtRequestStage || inFlightIntercept.responseOverride || inFlightIntercept.forceNetworkError) {
        abortSubscriptions = true

        return true
      }

      stopPropagationNow = result.stopPropagation

      if (result.changedData) {
        mergeChanges(data, result.changedData as D)
      }

      return true
    }

    for (const { routeId, subscriptions, immediateStaticResponse } of inFlightIntercept.subscriptionsByRoute) {
      for (const subscription of subscriptions) {
        const handled = await handleSubscription(subscription)

        if (handled && shouldStopSubscriptions()) {
          break
        }
      }

      if (abortSubscriptions) {
        break outerLoop
      }

      if (currentEventName === 'before:request' && immediateStaticResponse) {
        const hasOnlyLog = _.isEqual(Object.keys(immediateStaticResponse), ['log'])

        if (!hasOnlyLog) {
          const route = inFlightIntercept.matchingRoutes.find(({ id }) => id === routeId)

          if (!route) {
            throw new Error(`No route by ID ${routeId} for static response`)
          }

          const response = await buildHttpResponseFromStatic(immediateStaticResponse, route.getFixture)

          markInFlightInterceptStaticResponse(inFlightIntercept, immediateStaticResponse, response)

          return data
        }
      }

      if (shouldStopSubscriptions()) {
        break outerLoop
      }
    }
  }

  return data
}
