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
export const onNetworkLoadingFailed: HandlerFn<CyHttpMessages.NetworkLoadingFailed> = async (Cypress, frame, userHandler, { getRequest }) => {
  const request = getRequest(frame.subscription.routeId, frame.requestId)

  const { data } = frame

  if (!request) {
    return null
  }

  if (data.canceled) {
    request.state = 'Canceled'
  }

  return null
}
