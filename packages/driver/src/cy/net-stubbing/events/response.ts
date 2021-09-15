import _ from 'lodash'

import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
} from '@packages/net-stubbing/lib/types'
import {
  validateStaticResponse,
  parseStaticResponseShorthand,
  STATIC_RESPONSE_KEYS,
} from '../static-response-utils'
import $errUtils from '../../../cypress/error_utils'
import type { HandlerFn, HandlerResult } from '.'
import Bluebird from 'bluebird'
import { parseJsonBody, stringifyJsonBody } from './utils'

type Result = HandlerResult<CyHttpMessages.IncomingResponse>

export const onResponse: HandlerFn<CyHttpMessages.IncomingResponse> = async (Cypress, frame, userHandler, { getRoute, getRequest, sendStaticResponse }) => {
  const { data: res, requestId, subscription } = frame
  const { routeId } = subscription
  const request = getRequest(routeId, frame.requestId)
  const resClone = _.cloneDeep(res)

  const bodyParsed = parseJsonBody(res)

  let responseSent = false
  let resolved = false

  if (request) {
    request.state = 'ResponseReceived'

    if (!userHandler) {
      // this is notification-only, update the request with the response attributes and end
      request.response = res

      return null
    }
  }

  const finishResponseStage = (res) => {
    if (request) {
      if (!_.isEqual(resClone, res)) {
        request.setLogFlag('resModified')
      }

      request.response = _.cloneDeep(res)
      request.state = 'ResponseIntercepted'
    }
  }

  if (!request) {
    return null
  }

  const userRes: CyHttpMessages.IncomingHttpResponse = {
    ...res,
    send (staticResponse?, maybeBody?, maybeHeaders?) {
      if (resolved) {
        return $errUtils.throwErrByPath('net_stubbing.response_handling.send_called_after_resolved', { args: { res } })
      }

      if (responseSent) {
        return $errUtils.throwErrByPath('net_stubbing.response_handling.multiple_send_calls', { args: { res } })
      }

      const shorthand = parseStaticResponseShorthand(staticResponse, maybeBody, maybeHeaders)

      if (shorthand) {
        staticResponse = shorthand
      }

      if (staticResponse) {
        responseSent = true
        validateStaticResponse('res.send', staticResponse)

        // arguments to res.send() are merged with the existing response
        const _staticResponse = _.defaults({}, staticResponse, _.pick(res, STATIC_RESPONSE_KEYS))

        _staticResponse.headers = _.defaults({}, _staticResponse.headers, res.headers)

        // https://github.com/cypress-io/cypress/issues/17084
        // When a user didn't provide content-type,
        // and they provided body as an object,
        // we remove the content-type provided by the server
        if (!staticResponse.headers || !staticResponse.headers['content-type']) {
          if (typeof _staticResponse.body === 'object') {
            delete _staticResponse.headers['content-type']
          }
        }

        sendStaticResponse(requestId, _staticResponse)

        return finishResponseStage(_staticResponse)
      }

      return sendContinueFrame(true)
    },
    setDelay (delay) {
      res.delay = delay

      return this
    },
    setThrottle (throttleKbps) {
      res.throttleKbps = throttleKbps

      return this
    },
  }

  const sendContinueFrame = (stopPropagation: boolean) => {
    responseSent = true

    // copy changeable attributes of userRes to res
    _.merge(res, _.pick(userRes, SERIALIZABLE_RES_PROPS))

    finishResponseStage(res)

    if (bodyParsed) {
      stringifyJsonBody(res)
    }

    resolve({
      changedData: _.cloneDeep(res),
      stopPropagation,
    })
  }

  const timeout = Cypress.config('defaultCommandTimeout')
  const curTest = Cypress.state('test')

  let resolve: (result: Result) => void

  const promise: Promise<Result> = new Promise((_resolve) => {
    resolve = _resolve
  })

  return Bluebird.try(() => {
    return userHandler!(userRes)
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
        route: _.get(getRoute(routeId), 'options'),
        res,
      },
    })
  })
  .then(() => {
    if (!responseSent) {
      // user did not send, continue response
      sendContinueFrame(false)
    }
  })
  .finally(() => {
    resolved = true
  })
  .return(promise)
}
