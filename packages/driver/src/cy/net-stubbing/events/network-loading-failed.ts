import type { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import type { HandlerFn } from '.'

/**
 * Function to handle the CDP network loading event. Currently we only handle the canceled case.
 * @param Cypress -unused
 * @param frame - the packet of data returned from the service.
 * @param userHandler - unused
 * @param getRequest - utility method used to find the request related to
 * @returns null
 */
export const onNetworkLoadingFailed: HandlerFn<CyHttpMessages.NetworkLoadingFailed> = async (Cypress, frame, userHandler, { getRoute, getRequest }) => {
  const { data, requestId, subscription } = frame

  if (!data.canceled) {
    return null
  }

  const { routeId } = subscription
  const request = getRequest(frame.subscription.routeId, frame.requestId)

  // It's possible the request has been rejected prior to even being sent.
  // in that event, inject a new canceled request
  if (!request) {
    const route = getRoute(routeId)

    if (!route) {
      return null
    }

    route.requests[requestId] = {
      id: requestId,
      browserRequestId: frame.browserRequestId,
      routeId,
      state: 'Canceled',
      requestWaited: false,
      responseWaited: false,
      subscriptions: [],
      setLogFlag: () => {
        throw new Error('default setLogFlag reached')
      },
    }
  } else {
    request.state = 'Canceled'
  }

  return null
}
