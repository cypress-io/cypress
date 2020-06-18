import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { errByPath, makeErrFromObj } from '../../../cypress/error_utils'
import { HandlerFn } from './'

export const onRequestComplete: HandlerFn<NetEventFrames.HttpRequestComplete> = (Cypress, frame, { failCurrentTest, getRequest, getRoute }) => {
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  if (!request) {
    return
  }

  if (frame.error) {
    const error = makeErrFromObj(frame.error)
    const err = errByPath('net_stubbing.reply_request_error', {
      error,
      req: request.request,
      route: getRoute(frame.routeHandlerId),
    })

    request.state = 'Errored'
    request.log.snapshot('error').error(err)

    if (request.responseHandler) {
      // if req.reply was used to register a response handler, the user is implicitly
      // expecting there to be a successful response from the server, so fail the test
      // since a network error has occured
      return failCurrentTest(err)
    }

    return
  }

  request.state = 'Complete'
  request.log.snapshot('response').end()
}
