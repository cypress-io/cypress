import _ from 'lodash'

import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
  NetEventFrames,
} from '@packages/net-stubbing/lib/types'
import {
  validateStaticResponse,
  parseStaticResponseShorthand,
} from '../static-response-utils'
import $errUtils from '@packages/driver/src/cypress/error_utils'
import { HandlerFn } from './'

export const onResponseReceived: HandlerFn<NetEventFrames.HttpResponseReceived> = (Cypress, frame, { getRoute, getRequest, emitNetEvent }) => {
  const { res, requestId, routeHandlerId } = frame
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  let sendCalled = false

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
      if (sendCalled) {
        return $errUtils.throwErrByPath('net_stubbing.multiple_send_calls', { args: { res } })
      }

      sendCalled = true

      const shorthand = parseStaticResponseShorthand(staticResponse, maybeBody, maybeHeaders)

      if (shorthand) {
        staticResponse = shorthand
      }

      if (staticResponse) {
        validateStaticResponse(staticResponse)
        continueFrame.staticResponse = staticResponse
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

  try {
      request.responseHandler!(userRes)
  } catch (err) {
    $errUtils.throwErrByPath('net_stubbing.res_cb_failed', {
      args: {
        err,
        req: request.request,
        route: _.get(getRoute(routeHandlerId), 'options'),
        res,
      },
    })
  }
}
