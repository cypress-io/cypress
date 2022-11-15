import type { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import type { HandlerFn } from '.'

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
