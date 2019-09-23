import _ from 'lodash'

import {
  RequestState,
  Route,
  Request,
} from './types'
import {
  CyHttpMessages,
  RouteHandler,
  RouteMatcherOptions,
  RouteMatcher,
  StaticResponse,
  HttpRequestInterceptor,
  WebSocketController,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  SERIALIZABLE_REQ_PROPS,
  SERIALIZABLE_RES_PROPS,
  AnnotatedRouteMatcherOptions,
  AnnotatedStringMatcher,
  NetEventFrames,
} from '../types'

/**
 * Annotate non-primitive types so that they can be passed to the backend and re-hydrated.
 */
function _annotateMatcherOptionsTypes (options: RouteMatcherOptions) {
  const stringMatcherFields = STRING_MATCHER_FIELDS
  .concat(
    // add the nested DictStringMatcher values to the list of fields to annotate
    _.flatten(
      _.filter(
        DICT_STRING_MATCHER_FIELDS.map((field) => {
          const value = options[field]

          if (value) {
            return _.keys(value).map((key) => {
              return `${field}.${key}`
            })
          }

          return ''
        })
      )
    )
  )

  const ret : AnnotatedRouteMatcherOptions = {}

  stringMatcherFields.forEach((field) => {
    const value = _.get(options, field)

    if (value) {
      _.set(ret, field, {
        type: (_isRegExp(value)) ? 'regex' : 'glob',
        value: value.toString(),
      } as AnnotatedStringMatcher)
    }
  })

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']

  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

function _getUniqueId () {
  return `${Number(new Date()).toString()}-${_.uniqueId()}`
}

function _isHttpRequestInterceptor (obj) : obj is HttpRequestInterceptor {
  return typeof obj === 'function'
}

function _isWebSocketController (obj, options) : obj is WebSocketController {
  return typeof obj === 'object' && options.webSocket === true
}

function _isRegExp (obj) : obj is RegExp {
  return obj && (obj instanceof RegExp || obj.__proto__ === RegExp.prototype || obj.__proto__.constructor.name === 'RegExp')
}

function _parseStaticResponseShorthand (statusCodeOrBody, bodyOrHeaders, maybeHeaders) {
  if (_.isNumber(statusCodeOrBody)) {
    // statusCodeOrBody is a status code
    const staticResponse : StaticResponse = {
      statusCode: statusCodeOrBody,
    }

    if (!_.isUndefined(bodyOrHeaders)) {
      staticResponse.body = bodyOrHeaders
    }

    if (_.isObject(maybeHeaders)) {
      staticResponse.headers = maybeHeaders
    }

    return staticResponse
  }

  if (_.isString(statusCodeOrBody) && !maybeHeaders) {
    // statusCodeOrBody is body
    const staticResponse : StaticResponse = {
      body: statusCodeOrBody,
    }

    if (_.isObject(bodyOrHeaders)) {
      staticResponse.headers = bodyOrHeaders
    }

    return staticResponse
  }

  return
}

function _validateStaticResponse (staticResponse: StaticResponse): void {
  const { body, statusCode, headers, destroySocket } = staticResponse

  if (destroySocket && (body || statusCode || headers)) {
    throw new Error('`destroySocket`, if passed, must be the only option in the StaticResponse.')
  }

  if (body && !_.isString(body)) {
    throw new Error('`body` must be a string.')
  }

  if (statusCode && !(_.isNumber(statusCode) && _.inRange(statusCode, 0, 999))) {
    throw new Error('`statusCode` must be a number between 0 and 999.')
  }

  if (headers && _.keys(_.omitBy(headers, _.isString))) {
    throw new Error('`headers` must be a map of strings to strings.')
  }
}

export function registerCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State /* config */) {
  const { utils } = Cypress
  // TODO: figure out what to do for XHR compatibility

  function _emit (eventName: string, ...args: any[]) {
    // all messages from driver to server are wrapped in backend:request
    return Cypress.backend('net', eventName, ...args)
  }

  function _getRoute (routeHandlerId: string) {
    return state('routes')[routeHandlerId]
  }

  function _getRequest (routeHandlerId: string, requestId: string) {
    const route = _getRoute(routeHandlerId)

    if (route) {
      return route.requests[requestId]
    }
  }

  function _getNewRouteLog (matcher: RouteMatcherOptions, isStubbed: boolean, alias: string | void, staticResponse?: StaticResponse) {
    let obj : Partial<Cypress.LogConfig> = {
      name: 'route',
      instrument: 'route',
      isStubbed,
      numResponses: 0,
      response: staticResponse ? (staticResponse.body || '< empty body >') : (isStubbed ? '< callback function >' : '< passthrough >'),
      consoleProps: () => {
        return {
          Method: obj.method,
          URL: obj.url,
          Status: obj.status,
          'Route Matcher': matcher,
          'Static Response': staticResponse,
          Alias: alias,
        }
      },
    }

    ;['method', 'url'].forEach((k) => {
      if (matcher[k]) {
        obj[k] = String(matcher[k]) // stringify RegExp
      } else {
        obj[k] = '*'
      }
    })

    if (staticResponse) {
      if (staticResponse.statusCode) {
        obj.status = staticResponse.statusCode
      } else {
        obj.status = 200
      }

      if (staticResponse.body) {
        obj.response = staticResponse.body
      } else {
        obj.response = '<empty body>'
      }
    }

    if (!obj.response) {
      if (isStubbed) {
        obj.response = '<callback function'
      } else {
        obj.response = '<passthrough>'
      }
    }

    if (alias) {
      obj.alias = alias
    }

    return Cypress.log(obj)
  }

  function _getRequestLog (route: Route, request: Omit<Request, 'log'>) {
    return Cypress.log({
      name: 'xhr',
      displayName: 'stubbed route',
      alias: route.alias,
      aliasType: 'route',
      type: 'parent',
      event: true,
      consoleProps: () => {
        return {
          Alias: route.alias,
          Method: request.req.method,
          URL: request.req.url,
          Matched: route.options,
          Handler: route.handler,
        }
      },
      renderProps: () => {
        return {
          indicator: request.state === RequestState.Completed ? 'successful' : 'pending',
          message: `${request.req.url} ${RequestState[request.state]}`,
        }
      },
    })
  }

  function _addRoute (matcher: RouteMatcherOptions, handler: RouteHandler) {
    const handlerId = _getUniqueId()

    const alias = cy.getNextAlias()

    const frame: NetEventFrames.AddRoute = {
      handlerId,
      routeMatcher: _annotateMatcherOptionsTypes(matcher),
    }

    switch (true) {
      case _isHttpRequestInterceptor(handler):
        break
      case _isWebSocketController(handler, matcher):
        break
      case _.isUndefined(handler):
        // TODO: handle this, for when users just want to alias/wait on route
        break
      case _.isString(handler):
        frame.staticResponse = { body: <string>handler }
        break
      case _.isObjectLike(handler):
        try {
          _validateStaticResponse(<StaticResponse>handler)
        } catch (err) {
          utils.throwErrByPath('net_stubbing.invalid_static_response', { args: { err, staticResponse: handler } })

          return Promise.resolve()
        }

        frame.staticResponse = <StaticResponse>handler
        break
      default:
        utils.throwErrByPath('net_stubbing.invalid_handler', { args: { handler } })

        return Promise.resolve()
    }

    state('routes')[handlerId] = {
      log: _getNewRouteLog(matcher, !!handler, alias, frame.staticResponse),
      options: matcher,
      handler,
      hitCount: 0,
      requests: {},
    }

    if (alias) {
      state('routes')[handlerId].alias = alias
    }

    return _emit('route:added', frame)
  }

  function route (matcher: RouteMatcher, handler: RouteHandler) {
    let options : RouteMatcherOptions

    if (matcher instanceof RegExp || typeof matcher === 'string') {
      options = {
        url: matcher,
      }
    } else {
      options = matcher
    }

    return _addRoute(options, handler)
    .then(() => null)
  }

  function server () : void {

  }

  function _onRequestReceived (frame: NetEventFrames.HttpRequestReceived) {
    const route = _getRoute(frame.routeHandlerId)
    const { req, requestId, routeHandlerId } = frame

    const sendContinueFrame = () => {
      continueSent = true

      request.state = RequestState.Intercepted

      // copy changeable attributes of userReq to req in frame
      // @ts-ignore
      continueFrame.req = {
        ..._.pick(userReq, SERIALIZABLE_REQ_PROPS),
      }

      _emit('http:request:continue', continueFrame)
    }

    if (!route) {
      // TODO: remove this logging once we're done
      // eslint-disable-next-line no-console
      console.log('no handler for HttpRequestReceived', { frame })

      return sendContinueFrame()
    }

    const request : Partial<Request> = {
      req,
      state: RequestState.Received,
    }

    request.log = _getRequestLog(route, request as Omit<Request, 'log'>)
    request.log.snapshot('request')

    // TODO: this misnomer is a holdover from XHR, should be numRequests
    route.log.set('numResponses', route.log.get('numResponses') + 1)
    route.requests[requestId] = request as Request

    if (frame.notificationOnly) {
      return
    }

    const continueFrame : Partial<NetEventFrames.HttpRequestContinue> = {
      routeHandlerId,
      requestId,
    }

    let nextCalled = false
    let replyCalled = false
    let continueSent = false

    route.hitCount++

    const userReq : CyHttpMessages.IncomingHttpRequest = {
      ...req,
      reply (responseHandler, maybeBody?, maybeHeaders?) {
        if (nextCalled) {
          return utils.warnByPath('net_stubbing.warn_reply_called_after_next', { args: { route: route.options, req } })
        }

        if (replyCalled) {
          return utils.warnByPath('net_stubbing.warn_multiple_reply_calls', { args: { route: route.options, req } })
        }

        replyCalled = true

        const staticResponse = _parseStaticResponseShorthand(responseHandler, maybeBody, maybeHeaders)

        if (staticResponse) {
          // TODO: _validateStaticResponse - but where does the error go?
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
          continueFrame.staticResponse = <StaticResponse>responseHandler
        }

        if (!continueSent) {
          sendContinueFrame()
        }
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

    if (!_.isFunction(handler)) {
      return sendContinueFrame()
    }

    if (handler.length === 1) {
      // did not consume next(), so continue synchronously
      handler(userReq)

      return sendContinueFrame()
    }

    // next() can be called to pass this to the next route
    const next = () => {
      if (replyCalled) {
        return utils.warnByPath('net_stubbing.warn_next_called_after_reply', { args: { route: route.options, req } })
      }

      if (nextCalled) {
        return utils.warnByPath('net_stubbing.warn_multiple_next_calls', { args: { route: route.options, req } })
      }

      nextCalled = true

      continueFrame.tryNextRoute = true
      sendContinueFrame()
    }

    // rely on handler to call next()
    handler(userReq, next)
  }

  function _onResponseReceived (frame: NetEventFrames.HttpResponseReceived) {
    const { res, requestId, routeHandlerId } = frame
    const request = _getRequest(frame.routeHandlerId, frame.requestId)

    let sendCalled = false

    request.state = RequestState.ResponseReceived

    const continueFrame : NetEventFrames.HttpResponseContinue = {
      routeHandlerId,
      requestId,
    }

    const sendContinueFrame = () => {
      // copy changeable attributes of userReq to req in frame
      // @ts-ignore
      continueFrame.res = {
        ..._.pick(userRes, SERIALIZABLE_RES_PROPS),
      }

      request.state = RequestState.ResponseIntercepted

      _emit('http:response:continue', continueFrame)
    }

    const userRes : CyHttpMessages.IncomingHttpResponse = {
      ...res,
      send (staticResponse?, maybeBody?, maybeHeaders?) {
        if (sendCalled) {
          return utils.warnByPath('net_stubbing.warn_multiple_send_calls', { args: { res } })
        }

        sendCalled = true

        const shorthand = _parseStaticResponseShorthand(staticResponse, maybeBody, maybeHeaders)

        if (shorthand) {
          // TODO: _validateStaticResponse - but where does the error go?
          staticResponse = shorthand
        }

        if (staticResponse) {
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
      // TODO: remove this logging once we're done
      // eslint-disable-next-line no-console
      console.log('no handler for HttpResponseReceived', { frame })

      return sendContinueFrame()
    }

    request.responseHandler(userRes)
  }

  function _onRequestComplete (frame: NetEventFrames.HttpRequestComplete) {
    const request = _getRequest(frame.routeHandlerId, frame.requestId)

    if (!request) {
      return
    }

    request.state = RequestState.Completed
    request.log.snapshot('response').end()
  }

  Cypress.on('test:before:run', () => {
    // wipe out callbacks, requests, and routes when tests start
    state('routes', {})
  })

  Cypress.on('net:event', (eventName, frame: any /** TODO: interfaceof NetEventFrames */) => {
    switch (eventName) {
      case 'http:request:received':
        _onRequestReceived(<NetEventFrames.HttpRequestReceived>frame)
        break
      case 'http:response:received':
        _onResponseReceived(<NetEventFrames.HttpResponseReceived>frame)
        break
      case 'http:request:complete':
        _onRequestComplete(<NetEventFrames.HttpRequestComplete>frame)
        break
      case 'ws:connect':
        break
      case 'ws:disconnect':
        break
      case 'ws:frame:outgoing':
        break
      case 'ws:frame:incoming':
        break
      default:
    }
  })

  Commands.addAll({
    route,
    server,
  })
}
