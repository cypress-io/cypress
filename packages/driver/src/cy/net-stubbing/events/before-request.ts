import _ from 'lodash'

import {
  Route,
  Interception,
  CyHttpMessages,
  SERIALIZABLE_REQ_PROPS,
  Subscription,
} from '../types'
import { parseJsonBody } from './utils'
import {
  validateStaticResponse,
  parseStaticResponseShorthand,
} from '../static-response-utils'
import $errUtils from '../../../cypress/error_utils'
import { HandlerFn } from '.'
import Bluebird from 'bluebird'
import { NetEvent } from '@packages/net-stubbing/lib/types'

export const onBeforeRequest: HandlerFn<CyHttpMessages.IncomingRequest> = (Cypress, frame, userHandler, { getRoute, emitNetEvent, sendStaticResponse }) => {
  function getRequestLog (route: Route, request: Omit<Interception, 'log'>) {
    return Cypress.log({
      name: 'xhr',
      displayName: 'req',
      alias: route.alias,
      aliasType: 'route',
      type: 'parent',
      event: true,
      method: request.request.method,
      timeout: undefined,
      consoleProps: () => {
        return {
          Alias: route.alias,
          Method: request.request.method,
          URL: request.request.url,
          Matched: route.options,
          Handler: route.handler,
        }
      },
      renderProps: () => {
        return {
          indicator: request.state === 'Complete' ? 'successful' : 'pending',
          message: `${request.request.url} ${request.state}`,
        }
      },
    })
  }

  const route = getRoute(frame.routeHandlerId)
  const { data: req, requestId, routeHandlerId } = frame

  parseJsonBody(req)

  const request: Interception = {
    id: requestId,
    routeHandlerId,
    request: req,
    state: 'Received',
    requestWaited: false,
    responseWaited: false,
    subscriptions: [],
    on (eventName, handler) {
      const subscription: Subscription = {
        id: _.uniqueId('Subscription'),
        routeHandlerId,
        eventName,
        await: true,
      }

      request.subscriptions.push({
        subscription,
        handler,
      })

      emitNetEvent('subscribe', { requestId, subscription } as NetEvent.ToServer.Subscribe)

      return request
    },
  }

  let resolved = false
  let replyCalled = false

  const userReq: CyHttpMessages.IncomingHttpRequest = {
    ...req,
    reply (responseHandler, maybeBody?, maybeHeaders?) {
      if (resolved) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.reply_called_after_resolved')
      }

      if (replyCalled) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.multiple_reply_calls')
      }

      replyCalled = true

      const staticResponse = parseStaticResponseShorthand(responseHandler, maybeBody, maybeHeaders)

      if (staticResponse) {
        responseHandler = staticResponse
      }

      if (_.isFunction(responseHandler)) {
        // allow `req` to be sent outgoing, then pass the response body to `responseHandler`
        request.responseHandler = responseHandler

        // signals server to send a http:response:received
        request.on('response', responseHandler)

        userReq.responseTimeout = userReq.responseTimeout || Cypress.config('responseTimeout')

        return sendContinueFrame()
      }

      if (!_.isUndefined(responseHandler)) {
        // `responseHandler` is a StaticResponse
        validateStaticResponse('req.reply', responseHandler)

        sendStaticResponse(requestId, responseHandler)

        return finishRequestStage(req)
      }

      return sendContinueFrame()
    },
    redirect (location, statusCode = 302) {
      userReq.reply({
        headers: { location },
        statusCode,
      })
    },
    destroy () {
      userReq.reply({
        forceNetworkError: true,
      }) // TODO: this misnomer is a holdover from XHR, should be numRequests
    },
  }

  let continueSent = false

  function finishRequestStage (req) {
    if (request) {
      request.request = _.cloneDeep(req)

      request.state = 'Intercepted'
      request.log && request.log.fireChangeEvent()
    }
  }

  if (!route) {
    return req
  }

  const sendContinueFrame = () => {
    if (continueSent) {
      throw new Error('sendContinueFrame called twice in handler')
    }

    continueSent = true

    // copy changeable attributes of userReq to req
    _.merge(req, _.pick(userReq, SERIALIZABLE_REQ_PROPS))

    finishRequestStage(req)

    if (_.isObject(req.body)) {
      req.body = JSON.stringify(req.body)
    }

    resolve(req)
  }

  let resolve: (changedData: CyHttpMessages.IncomingRequest) => void

  const promise: Promise<CyHttpMessages.IncomingRequest> = new Promise((_resolve) => {
    resolve = _resolve
  })

  request.log = getRequestLog(route, request as Omit<Interception, 'log'>)

  // TODO: this misnomer is a holdover from XHR, should be numRequests
  route.log.set('numResponses', (route.log.get('numResponses') || 0) + 1)
  route.requests[requestId] = request as Interception

  if (!_.isFunction(userHandler)) {
    // notification-only
    return req
  }

  route.hitCount++

  const timeout = Cypress.config('defaultCommandTimeout')
  const curTest = Cypress.state('test')

  // if a Promise is returned, wait for it to resolve. if req.reply()
  // has not been called, continue to the next interceptor
  return Bluebird.try(() => {
    return userHandler(userReq)
  })
  .catch((err) => {
    $errUtils.throwErrByPath('net_stubbing.request_handling.cb_failed', {
      args: {
        err,
        req,
        route: route.options,
      },
      errProps: {
        appendToStack: {
          title: 'From request callback',
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

    $errUtils.throwErrByPath('net_stubbing.request_handling.cb_timeout', { args: { timeout, req, route: route.options } })
  })
  .finally(() => {
    resolved = true
  })
  .then(() => {
    if (userReq.alias) {
      Cypress.state('aliasedRequests').push({
        alias: userReq.alias,
        request: request as Interception,
      })

      delete userReq.alias
    }

    if (!replyCalled) {
      // handler function resolved without resolving request, pass on
      sendContinueFrame()
    }
  })
  .return(promise)
}
