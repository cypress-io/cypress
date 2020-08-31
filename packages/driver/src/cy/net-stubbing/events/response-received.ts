import _ from 'lodash'

import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
  NetEventFrames,
} from '@packages/net-stubbing/lib/types'
import {
  validateStaticResponse,
  parseStaticResponseShorthand,
  STATIC_RESPONSE_KEYS,
  getBackendStaticResponse,
} from '../static-response-utils'
import $errUtils from '../../../cypress/error_utils'
import { HandlerFn } from './'
import Bluebird from 'bluebird'

export const onResponseReceived: HandlerFn<NetEventFrames.HttpResponseReceived> = (Cypress, frame, { getRoute, getRequest, emitNetEvent }) => {
  const { res, requestId, routeHandlerId } = frame
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  let sendCalled = false
  let resolved = false

  if (request) {
    request.state = 'ResponseReceived'
  }

  const continueFrame: NetEventFrames.HttpResponseContinue = {
    routeHandlerId,
    requestId,
  }

  const sendContinueFrame = () => {
    // copy changeable attributes of userReq to req in frame
    // @ts-ignore
    request.response = continueFrame.res = {
      ..._.pick(userRes, SERIALIZABLE_RES_PROPS),
    }

    if (request) {
      request.state = 'ResponseIntercepted'
    }

    emitNetEvent('http:response:continue', continueFrame)
  }

  const userRes: CyHttpMessages.IncomingHttpResponse = {
    ...res,
    send (staticResponse?, maybeBody?, maybeHeaders?) {
      if (resolved) {
        return $errUtils.throwErrByPath('net_stubbing.response_handling.send_called_after_resolved', { args: { res } })
      }

      if (sendCalled) {
        return $errUtils.throwErrByPath('net_stubbing.response_handling.multiple_send_calls', { args: { res } })
      }

      sendCalled = true

      const shorthand = parseStaticResponseShorthand(staticResponse, maybeBody, maybeHeaders)

      if (shorthand) {
        staticResponse = shorthand
      }

      if (staticResponse) {
        validateStaticResponse('res.send', staticResponse)

        continueFrame.staticResponse = getBackendStaticResponse(
          // arguments to res.send() are merged with the existing response
          _.defaultsDeep({}, staticResponse, _.pick(res, STATIC_RESPONSE_KEYS)),
        )
      }

      return sendContinueFrame()
    },
    delay (delayMs) {
      // reduce perceived delay by sending timestamp instead of offset
      continueFrame.continueResponseAt = Date.now() + delayMs

      return this
    },
    throttle (throttleKbps) {
      continueFrame.throttleKbps = throttleKbps

      return this
    },
  }

  if (!request) {
    return sendContinueFrame()
  }

  const timeout = Cypress.config('defaultCommandTimeout')

  return Bluebird.try(() => {
    return request.responseHandler!(userRes)
  })
  .catch((err) => {
    $errUtils.throwErrByPath('net_stubbing.response_handling.cb_failed', {
      args: {
        err,
        req: request.request,
        route: _.get(getRoute(routeHandlerId), 'options'),
        res,
      },
      errProps: {
        appendToStack: {
          title: 'From response callback',
          content: err.stack,
        },
      },
    })
  })
  .timeout(timeout)
  .catch(Bluebird.TimeoutError, (err) => {
    $errUtils.throwErrByPath('net_stubbing.response_handling.cb_timeout', {
      args: {
        timeout,
        req: request.request,
        route: _.get(getRoute(routeHandlerId), 'options'),
        res,
      },
    })
  })
  .then(() => {
    if (!sendCalled) {
      // user did not call send, send response
      userRes.send()
    }
  })
  .finally(() => {
    resolved = true
  })
}
