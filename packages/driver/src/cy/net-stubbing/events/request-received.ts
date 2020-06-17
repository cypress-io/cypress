import _ from 'lodash'

import {
  Route,
  Request,
  CyHttpMessages,
  StaticResponse,
  SERIALIZABLE_REQ_PROPS,
  NetEventFrames,
} from '../types'
import {
  validateStaticResponse,
  getBackendStaticResponse,
  parseStaticResponseShorthand,
} from '../static-response-utils'
import $errUtils from '@packages/driver/src/cypress/error_utils'
import { HandlerFn } from './'

export const onRequestReceived: HandlerFn<NetEventFrames.HttpRequestReceived> = (Cypress, frame, { getRoute, emitNetEvent }) => {
  function getRequestLog (route: Route, request: Omit<Request, 'log'>) {
    return Cypress.log({
      name: 'xhr',
      displayName: 'req',
      alias: route.alias,
      aliasType: 'route',
      type: 'parent',
      event: true,
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
  const { req, requestId, routeHandlerId } = frame

  const sendContinueFrame = () => {
    if (continueSent) {
      throw new Error('sendContinueFrame called twice in handler')
    }

    continueSent = true

    if (request) {
      request.state = 'Intercepted'
    }

    if (continueFrame) {
      // copy changeable attributes of userReq to req in frame
      // @ts-ignore
      continueFrame.req = {
        ..._.pick(userReq, SERIALIZABLE_REQ_PROPS),
      }

      emitNetEvent('http:request:continue', continueFrame)
    }
  }

  if (!route) {
    return sendContinueFrame()
  }

  const request: Partial<Request> = {
    id: requestId,
    request: req,
    state: 'Received',
  }

  request.log = getRequestLog(route, request as Omit<Request, 'log'>)
  request.log.snapshot('request')

  // TODO: this misnomer is a holdover from XHR, should be numRequests
  route.log.set('numResponses', (route.log.get('numResponses') || 0) + 1)
  route.requests[requestId] = request as Request

  if (frame.notificationOnly) {
    return
  }

  const continueFrame: Partial<NetEventFrames.HttpRequestContinue> = {
    routeHandlerId,
    requestId,
  }

  let nextCalled = false
  let replyCalled = false
  let continueSent = false

  route.hitCount++

  const userReq: CyHttpMessages.IncomingHttpRequest = {
    ...req,
    reply (responseHandler, maybeBody?, maybeHeaders?) {
      if (nextCalled) {
        return $errUtils.throwErrByPath('net_stubbing.reply_called_after_next', { args: { route: route.options, req } })
      }

      if (replyCalled) {
        return $errUtils.throwErrByPath('net_stubbing.multiple_reply_calls', { args: { route: route.options, req } })
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
        continueFrame.hasResponseHandler = true

        return
      }

      if (!_.isUndefined(responseHandler)) {
        // `replyHandler` is a StaticResponse
        validateStaticResponse(responseHandler)
        continueFrame.staticResponse = getBackendStaticResponse(responseHandler as StaticResponse)
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
        destroySocket: true,
      })
    },
  }

  const handler = route.handler as Function

  const tryHandler = (...args) => {
    try {
      handler(...args)
    } catch (err) {
      $errUtils.throwErrByPath('net_stubbing.req_cb_failed', { args: { err, req, route: route.options } })
    }
  }

  if (!_.isFunction(handler)) {
    return sendContinueFrame()
  }

  if (handler.length === 1) {
    // did not consume next(), so continue synchronously
    tryHandler(userReq)

    return sendContinueFrame()
  }

  // next() can be called to pass this to the next route
  const next = () => {
    if (replyCalled) {
      return $errUtils.throwErrByPath('net_stubbing.next_called_after_reply', { args: { route: route.options, req } })
    }

    if (nextCalled) {
      return $errUtils.throwErrByPath('net_stubbing.multiple_next_calls', { args: { route: route.options, req } })
    }

    nextCalled = true

    continueFrame.tryNextRoute = true

    return sendContinueFrame()
  }

  // rely on handler to call next()
  tryHandler(userReq, next)
}
