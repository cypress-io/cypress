import { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import { HandlerFn } from '.'

export const onResponse: HandlerFn<CyHttpMessages.ResponseComplete> = async (Cypress, frame, userHandler, { getRequest, getRoute }) => {
  const request = getRequest(frame.subscription.routeId, frame.requestId)

  if (!request) {
    return null
  }

  request.state = 'Complete'

  request.log.fireChangeEvent()
  request.log.end()

  userHandler && await userHandler(request.response!)

  return null
}
