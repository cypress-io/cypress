import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { HandlerFn } from './'

export const onRequestComplete: HandlerFn<NetEventFrames.HttpRequestComplete> = (Cypress, frame, { getRequest }) => {
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  if (!request) {
    return
  }

  request.state = 'Complete'
  request.log.snapshot('response').end()
}
