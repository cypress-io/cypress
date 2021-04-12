import { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import { HandlerFn } from '.'
import { parseJsonBody } from './utils'

export const onAfterResponse: HandlerFn<CyHttpMessages.ResponseComplete> = async (Cypress, frame, userHandler, { getRequest, getRoute }) => {
  const request = getRequest(frame.subscription.routeId, frame.requestId)

  if (!request) {
    return null
  }

  if (request.response && frame.data.finalResBody) {
    request.response.body = frame.data.finalResBody
    parseJsonBody(request.response)
  }

  request.state = 'Complete'

  request.log.fireChangeEvent()
  request.log.end()

  // @ts-ignore
  userHandler && await userHandler(request.response!)

  return null
}
