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
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  SERIALIZABLE_REQ_PROPS,
  SERIALIZABLE_RES_PROPS,
  AnnotatedRouteMatcherOptions,
  AnnotatedStringMatcher,
  NetEventFrames,
  StringMatcher,
  BackendStaticResponse,
  FixtureOpts,
  NumberMatcher,
  GenericStaticResponse,
} from '@packages/net-stubbing/lib/types'
import $errUtils from '@packages/driver/src/cypress/error_utils'

const STATIC_RESPONSE_KEYS: (keyof GenericStaticResponse<void>)[] = ['body', 'fixture', 'statusCode', 'headers', 'destroySocket']

/**
 * Get all STRING_MATCHER_FIELDS paths plus any extra fields the user has added within
 * DICT_STRING_MATCHER_FIELDS objects
 */
function _getAllStringMatcherFields (options: RouteMatcherOptions): string[] {
  return STRING_MATCHER_FIELDS
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
        }),
      ),
    ),
  )
}

/**
 * Annotate non-primitive types so that they can be passed to the backend and re-hydrated.
 */
function _annotateMatcherOptionsTypes (options: RouteMatcherOptions) {
  const ret: AnnotatedRouteMatcherOptions = {}

  _getAllStringMatcherFields(options).forEach((field) => {
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

function _isHttpRequestInterceptor (obj): obj is HttpRequestInterceptor {
  return typeof obj === 'function'
}

function _isRegExp (obj): obj is RegExp {
  return obj && (obj instanceof RegExp || obj.__proto__ === RegExp.prototype || obj.__proto__.constructor.name === 'RegExp')
}

function _isStringMatcher (obj): obj is StringMatcher {
  return _isRegExp(obj) || _.isString(obj)
}

function _isNumberMatcher (obj): obj is NumberMatcher {
  return Array.isArray(obj) ? _.every(obj, _.isNumber) : _.isNumber(obj)
}

function _parseStaticResponseShorthand (statusCodeOrBody: number | string | any, bodyOrHeaders: string | { [key: string]: string }, maybeHeaders?: { [key: string]: string }) {
  if (_.isNumber(statusCodeOrBody)) {
    // statusCodeOrBody is a status code
    const staticResponse: StaticResponse = {
      statusCode: statusCodeOrBody,
    }

    if (!_.isUndefined(bodyOrHeaders)) {
      staticResponse.body = bodyOrHeaders as string
    }

    if (_.isObject(maybeHeaders)) {
      staticResponse.headers = maybeHeaders as { [key: string]: string }
    }

    return staticResponse
  }

  if (_.isString(statusCodeOrBody) && !maybeHeaders) {
    // statusCodeOrBody is body
    const staticResponse: StaticResponse = {
      body: statusCodeOrBody,
    }

    if (_.isObject(bodyOrHeaders)) {
      staticResponse.headers = bodyOrHeaders as { [key: string]: string }
    }

    return staticResponse
  }

  return
}

function _validateRouteMatcherOptions (routeMatcher: RouteMatcherOptions): void {
  if (_.isEmpty(routeMatcher)) {
    throw new Error('The RouteMatcher does not contain any keys. You must pass something to match on.')
  }

  _getAllStringMatcherFields(routeMatcher).forEach((path) => {
    const v = _.get(routeMatcher, path)

    if (_.has(routeMatcher, path) && !_isStringMatcher(v)) {
      throw new Error(`\`${path}\` must be a string or a regular expression.`)
    }
  })

  if (_.has(routeMatcher, 'https') && !_.isBoolean(routeMatcher.https)) {
    throw new Error('`https` must be a boolean.')
  }

  if (_.has(routeMatcher, 'port') && !_isNumberMatcher(routeMatcher.port)) {
    throw new Error('`port` must be a number or a list of numbers.')
  }
}

function _validateStaticResponse (staticResponse: StaticResponse): void {
  const { body, fixture, statusCode, headers, destroySocket } = staticResponse

  if (destroySocket && (body || statusCode || headers)) {
    throw new Error('`destroySocket`, if passed, must be the only option in the StaticResponse.')
  }

  if (body && fixture) {
    throw new Error('`body` and `fixture` cannot both be set, pick one.')
  }

  if (fixture && !_.isString(fixture)) {
    throw new Error('`fixture` must be a string containing a path and, optionally, an encoding separated by a comma (for example, "foo.txt,ascii").')
  }

  if (body && !_.isString(body)) {
    throw new Error('`body` must be a string.')
  }

  // statusCode must be a three-digit integer
  // @see https://tools.ietf.org/html/rfc2616#section-6.1.1
  if (statusCode && !(_.isNumber(statusCode) && _.inRange(statusCode, 100, 999))) {
    throw new Error('`statusCode` must be a number between 100 and 999 (inclusive).')
  }

  if (headers && _.keys(_.omitBy(headers, _.isString)).length) {
    throw new Error('`headers` must be a map of strings to strings.')
  }
}

function _getFixtureOpts (fixture: string): FixtureOpts {
  const [filePath, encoding] = fixture.split(',')

  return { filePath, encoding }
}

function _getBackendStaticResponse (staticResponse: StaticResponse): BackendStaticResponse {
  if (staticResponse.fixture) {
    return {
      ...staticResponse,
      fixture: _getFixtureOpts(staticResponse.fixture),
    }
  }

  // no modification required, just coerce the type
  return staticResponse as unknown as BackendStaticResponse
}

export function registerCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State /* config */) {
  function _emit (eventName: string, frame: any) {
    // all messages from driver to server are wrapped in backend:request
    return Cypress.backend('net', eventName, frame)
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
    let obj: Partial<Cypress.LogConfig> = {
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
      displayName: 'req',
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

    let staticResponse: StaticResponse | undefined = undefined

    switch (true) {
      case _isHttpRequestInterceptor(handler):
        break
      case _.isUndefined(handler):
        // TODO: handle this, for when users just want to alias/wait on route
        break
      case _.isString(handler):
        staticResponse = { body: <string>handler }
        break
      case _.isObjectLike(handler):
        if (!_.intersection(_.keys(handler), STATIC_RESPONSE_KEYS).length && !_.isEmpty(handler)) {
          // the user has not supplied any of the StaticResponse keys, assume it's a JSON object
          handler = {
            body: JSON.stringify(handler),
            headers: {
              'content-type': 'application/json',
            },
          }
        }

        try {
          _validateStaticResponse(<StaticResponse>handler)
        } catch (err) {
          return $errUtils.throwErrByPath('net_stubbing.invalid_static_response', { args: { err, staticResponse: handler } })
        }

        staticResponse = handler as StaticResponse
        break
      default:
        return $errUtils.throwErrByPath('net_stubbing.invalid_handler', { args: { handler } })
    }

    if (staticResponse) {
      frame.staticResponse = _getBackendStaticResponse(staticResponse)
    }

    state('routes')[handlerId] = {
      log: _getNewRouteLog(matcher, !!handler, alias, staticResponse),
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

  function route2 (matcher: RouteMatcher, handler: RouteHandler | StringMatcher, arg2?: RouteHandler) {
    if (!Cypress.config('experimentalNetworkMocking')) {
      return $errUtils.throwErrByPath('net_stubbing.route2_needs_experimental')
    }

    function _getMatcherOptions (): RouteMatcherOptions {
      if (_.isString(matcher) && _isStringMatcher(handler) && arg2) {
        // method, url, handler
        const url = handler as StringMatcher

        handler = arg2

        return {
          method: matcher,
          url,
        }
      }

      if (_isStringMatcher(matcher)) {
        // url, handler
        return {
          url: matcher,
        }
      }

      return matcher
    }

    const routeMatcherOptions = _getMatcherOptions()

    try {
      _validateRouteMatcherOptions(routeMatcherOptions)
    } catch (err) {
      $errUtils.throwErrByPath('net_stubbing.invalid_route_matcher', { args: { err, matcher: routeMatcherOptions } })
    }

    return _addRoute(routeMatcherOptions, handler as RouteHandler)
    .then(() => null)
  }

  function _onRequestReceived (frame: NetEventFrames.HttpRequestReceived) {
    const route = _getRoute(frame.routeHandlerId)
    const { req, requestId, routeHandlerId } = frame

    const sendContinueFrame = () => {
      continueSent = true

      if (request) {
        request.state = RequestState.Intercepted
      }

      if (continueFrame) {
        // copy changeable attributes of userReq to req in frame
        // @ts-ignore
        continueFrame.req = {
          ..._.pick(userReq, SERIALIZABLE_REQ_PROPS),
        }

        _emit('http:request:continue', continueFrame)
      }
    }

    if (!route) {
      // TODO: remove this logging once we're done
      // eslint-disable-next-line no-console
      console.log('no handler for HttpRequestReceived', { frame })

      return sendContinueFrame()
    }

    const request: Partial<Request> = {
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
          continueFrame.staticResponse = _getBackendStaticResponse(responseHandler as StaticResponse)
        }

        if (!continueSent) {
          sendContinueFrame()
        }

        return
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

  function _onResponseReceived (frame: NetEventFrames.HttpResponseReceived) {
    const { res, requestId, routeHandlerId } = frame
    const request = _getRequest(frame.routeHandlerId, frame.requestId)

    let sendCalled = false

    request.state = RequestState.ResponseReceived

    const continueFrame: NetEventFrames.HttpResponseContinue = {
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

    const userRes: CyHttpMessages.IncomingHttpResponse = {
      ...res,
      send (staticResponse?, maybeBody?, maybeHeaders?) {
        if (sendCalled) {
          return $errUtils.throwErrByPath('net_stubbing.multiple_send_calls', { args: { res } })
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

    try {
      request.responseHandler(userRes)
    } catch (err) {
      $errUtils.throwErrByPath('net_stubbing.res_cb_failed', {
        args: {
          err,
          req: request.req,
          route: _getRoute(routeHandlerId).options,
          res,
        },
      })
    }
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

  const netEventHandlers = {
    'http:request:received': _onRequestReceived,
    'http:response:received': _onResponseReceived,
    'http:request:complete': _onRequestComplete,
  }

  Cypress.on('net:event', (eventName, frame: any /** TODO: interfaceof NetEventFrames */) => {
    try {
      const handler = netEventHandlers[eventName]

      handler(frame)
    } catch (err) {
      // errors have to be manually propagated here
      // @ts-ignore
      Cypress.action('cy:fail', err, state('runnable'))
    }
  })

  Commands.addAll({
    route2,
  })
}
