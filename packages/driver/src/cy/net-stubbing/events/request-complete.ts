import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { errByPath, makeErrFromObj } from '../../../cypress/error_utils'
import { HandlerFn } from './'

export const onRequestComplete: HandlerFn<NetEventFrames.HttpRequestComplete> = (Cypress, frame, { failCurrentTest, getRequest, getRoute }) => {
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  if (!request) {
    return
  }

  if (frame.error) {
    const getDescriptiveError = (): Error => {
      const error = frame.error!
      const errOpts = {
        innerErr: makeErrFromObj(error),
        req: request.request,
        route: getRoute(frame.routeHandlerId),
      }

      if (error.code && ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(error.code)) {
        return errByPath('net_stubbing.reply_request_timeout', errOpts)
      }

      return errByPath('net_stubbing.reply_request_error', errOpts)
    }

    const err = getDescriptiveError()

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
