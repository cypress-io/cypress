import _ from 'lodash'

import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
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

export const onResponseReceived: HandlerFn<CyHttpMessages.IncomingResponse> = async (Cypress, frame, handler, { getRoute, getRequest, emitNetEvent }) => {
  const { data: res, requestId, routeHandlerId } = frame
  const request = getRequest(frame.routeHandlerId, frame.requestId)

  parseJsonBody(res)

  let sendCalled = false
  let resolved = false

  if (request) {
    request.state = 'ResponseReceived'

    request.log.fireChangeEvent()

    if (!handler) {
      // this is notification-only, update the request with the response attributes and end
      request.response = res

      return res
    }
  }

  const finishResponseStage = (res) => {
    if (request) {
      request.response = _.cloneDeep(res)
      request.state = 'ResponseIntercepted'
      request.log.fireChangeEvent()
    }
  }

  if (!request) {
    return res
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

        emitNetEvent('send:static:response', {
          routeHandlerId,
          requestId,
          staticResponse: getBackendStaticResponse(_staticResponse),
        })

        return finishResponseStage(_staticResponse)
      }

      return sendContinueFrame()
    },
    delay (delayMs) {
      res.delayMs = delayMs

      return this
    },
    throttle (throttleKbps) {
      res.throttleKbps = throttleKbps

      return this
    },
  }

  const sendContinueFrame = () => {
    // copy changeable attributes of userRes to res
    _.merge(res, _.pick(userRes, SERIALIZABLE_RES_PROPS))

    finishResponseStage(res)

    if (_.isObject(res.body)) {
      res.body = JSON.stringify(res.body)
    }

    resolve(_.cloneDeep(res))
  }

  const timeout = Cypress.config('defaultCommandTimeout')
  const curTest = Cypress.state('test')

  let resolve: (changedData: CyHttpMessages.IncomingResponse) => void

  const promise: Promise<CyHttpMessages.IncomingResponse> = new Promise((_resolve) => {
    resolve = _resolve
  })

  return Bluebird.try(() => {
    return handler!(userRes)
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
  .then(() => promise)
}
