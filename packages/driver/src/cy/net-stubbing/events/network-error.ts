import { get } from 'lodash'
import type { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import $errUtils from '../../../cypress/error_utils'
import type { HandlerFn } from '.'

export const onNetworkError: HandlerFn<CyHttpMessages.NetworkError> = async (Cypress, frame, userHandler, { getRequest, getRoute }) => {
  const request = getRequest(frame.subscription.routeId, frame.requestId)

  const { data } = frame

  if (!request) {
    return null
  }

  let err = $errUtils.makeErrFromObj(data.error)
  // does this request have a user response callback handler?
  const hasResponseHandler = !!request.subscriptions.find(({ subscription }) => {
    return subscription.eventName === 'response:callback'
  })
  const isAwaitingResponse = hasResponseHandler && ['Received', 'Intercepted'].includes(request.state)
  const isTimeoutError = data.error.code && ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(data.error.code)

  if (isAwaitingResponse || isTimeoutError) {
    const errorName = isTimeoutError ? 'timeout' : 'network_error'

    err = $errUtils.errByPath(`net_stubbing.request_error.${errorName}`, {
      innerErr: err,
      req: request.request,
      route: get(getRoute(frame.subscription.routeId), 'options'),
    })
  }

  // @ts-ignore
  userHandler && await userHandler(err)

  request.state = 'Errored'
  request.error = err

  if (isAwaitingResponse) {
    // the user is implicitly expecting there to be a successful response from the server, so fail the test
    // since a network error has occurred
    throw err
  }

  return null
}
