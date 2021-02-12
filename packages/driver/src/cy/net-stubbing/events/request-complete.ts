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
    let err = makeErrFromObj(frame.error)
    // does this request have a responseHandler that has not run yet?
    const isAwaitingResponse = !!request.responseHandler && ['Received', 'Intercepted'].includes(request.state)
    const isTimeoutError = frame.error.code && ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(frame.error.code)

    if (isAwaitingResponse || isTimeoutError) {
      const errorName = isTimeoutError ? 'timeout' : 'network_error'

      err = errByPath(`net_stubbing.request_error.${errorName}`, {
        innerErr: err,
        req: request.request,
        route: get(getRoute(frame.routeHandlerId), 'options'),
      })
    }

    request.state = 'Errored'
    request.error = err

    request.log.error(err)

    if (isAwaitingResponse) {
      // the user is implicitly expecting there to be a successful response from the server, so fail the test
      // since a network error has occured
      return failCurrentTest(err)
    }

    return
  }

  request.state = 'Complete'

  request.log.fireChangeEvent()
  request.log.end()
}
