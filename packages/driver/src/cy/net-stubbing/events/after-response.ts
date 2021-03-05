import { get } from 'lodash'
import { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import { errByPath, makeErrFromObj } from '../../../cypress/error_utils'
import { HandlerFn } from '.'

export const onAfterResponse: HandlerFn<CyHttpMessages.ResponseComplete> = (Cypress, frame, userHandler, { getRequest, getRoute }) => {
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  const { data } = frame

  if (!request) {
    return frame.data
  }

  if (data.error) {
    let err = makeErrFromObj(data.error)
    // does this request have a `before:response` handler pending?
    const hasResponseHandler = !!request.subscriptions.find(({ subscription }) => {
      return subscription.eventName === 'before:response'
    })
    const isAwaitingResponse = hasResponseHandler && ['Received', 'Intercepted'].includes(request.state)
    const isTimeoutError = data.error.code && ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(data.error.code)

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
      throw err
    }

    return frame.data
  }

  request.state = 'Complete'

  request.log.fireChangeEvent()
  request.log.end()

  return frame.data
}
