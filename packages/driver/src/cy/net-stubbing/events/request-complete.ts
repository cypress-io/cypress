import { get } from 'lodash'
import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { errByPath, makeErrFromObj } from '../../../cypress/error_utils'
import { HandlerFn } from './'

export const onRequestComplete: HandlerFn<NetEventFrames.HttpRequestComplete> = (Cypress, frame, { failCurrentTest, getRequest, getRoute }) => {
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  if (!request) {
    return
  }

  if (frame.error) {
    const isTimeoutError = frame.error.code && ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(frame.error.code)
    const errorName = isTimeoutError ? 'timeout' : 'network_error'

    const err = errByPath(`net_stubbing.request_error.${errorName}`, {
      innerErr: makeErrFromObj(frame.error),
      req: request.request,
      route: get(getRoute(frame.routeHandlerId), 'options'),
    })

    request.state = 'Errored'

    if (request.responseHandler) {
      // if req.reply was used to register a response handler, the user is implicitly
      // expecting there to be a successful response from the server, so fail the test
      // since a network error has occured
      return failCurrentTest(err)
    }

    return
  }

  request.state = 'Complete'

  request.log.fireChangeEvent()
  request.log.end()
}
