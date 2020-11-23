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
import { parseJsonBody } from './utils'

export const onResponseReceived: HandlerFn<NetEventFrames.HttpResponseReceived> = (Cypress, frame, { getRoute, getRequest, emitNetEvent }) => {
  const { res, requestId, routeHandlerId } = frame
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  parseJsonBody(res)

  let sendCalled = false
  let resolved = false

  if (request) {
    request.state = 'ResponseReceived'

    request.log.fireChangeEvent()

    if (!request.responseHandler) {
      // this is notification-only, update the request with the response attributes and end
      request.response = res

      return
    }
  }

  const continueFrame: NetEventFrames.HttpResponseContinue = {
    routeHandlerId,
    requestId,
  }

  const sendContinueFrame = () => {
    // copy changeable attributes of userRes to res in frame
    // if the user is setting a StaticResponse, use that instead
    // @ts-ignore
    continueFrame.res = {
      ..._.pick(continueFrame.staticResponse || userRes, SERIALIZABLE_RES_PROPS),
    }

    if (request) {
      request.response = _.clone(continueFrame.res)
      request.state = 'ResponseIntercepted'
      request.log.fireChangeEvent()
    }

    if (_.isObject(continueFrame.res!.body)) {
      continueFrame.res!.body = JSON.stringify(continueFrame.res!.body)
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

        // arguments to res.send() are merged with the existing response
        const _staticResponse = _.defaults({}, staticResponse, _.pick(res, STATIC_RESPONSE_KEYS))

        _.defaults(_staticResponse.headers, res.headers)

        continueFrame.staticResponse = getBackendStaticResponse(_staticResponse)
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
  const curTest = Cypress.state('test')

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
    if (Cypress.state('test') !== curTest) {
      // active test has changed, ignore the timeout
      return
    }

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
