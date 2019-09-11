import * as _ from 'lodash'
import * as Promise from 'bluebird'
import {
  CyHttpMessages,
  RouteHandler,
  RouteMatcherOptionsGeneric,
  RouteMatcherOptions,
  RouteMatcher,
  StaticResponse,
  HttpRequestInterceptor,
  WebSocketController,
  HttpResponseInterceptor,
} from '../../../../../cli/types/cy-net-stubbing'

const utils = require('../../cypress/utils')

export const SERIALIZABLE_REQ_PROPS = [
  'headers',
  'body', // doesn't exist on the OG message, but will be attached by the backend
  'url',
  'method',
  'httpVersion',
]

export const SERIALIZABLE_RES_PROPS = _.concat(
  SERIALIZABLE_REQ_PROPS,
  'statusCode',
  'statusMessage'
)

export const DICT_STRING_MATCHER_FIELDS = ['headers', 'query']

export const STRING_MATCHER_FIELDS = ['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url']

/**
 * Serializable `StringMatcher` type.
 */
interface AnnotatedStringMatcher {
  type: 'regex' | 'glob'
  value: string
}

/**
 * Serializable `RouteMatcherOptions` type.
 */
export type AnnotatedRouteMatcherOptions = RouteMatcherOptionsGeneric<AnnotatedStringMatcher>

/** Types for messages between driver and server */

export declare namespace NetEventFrames {
  export interface AddRoute {
    routeMatcher: AnnotatedRouteMatcherOptions
    staticResponse?: StaticResponse
    handlerId?: string
  }

  interface BaseHttp {
    requestId: string
    routeHandlerId: string
  }

  // fired when HTTP proxy receives headers + body of request
  export interface HttpRequestReceived extends BaseHttp {
    req: CyHttpMessages.IncomingRequest
  }

  // fired when driver is done modifying request and wishes to pass control back to the proxy
  export interface HttpRequestContinue extends BaseHttp {
    req: CyHttpMessages.IncomingRequest
    staticResponse?: StaticResponse
    hasResponseHandler?: boolean
    tryNextRoute?: boolean
  }

  // fired when a response is received and the driver has a req.reply callback registered
  export interface HttpResponseReceived extends BaseHttp {
    res: CyHttpMessages.IncomingResponse
  }

  // fired when driver is done modifying response or driver callback completes,
  // passes control back to proxy
  export interface HttpResponseContinue extends BaseHttp {
    res?: CyHttpMessages.IncomingResponse
    staticResponse?: StaticResponse
    // Millisecond timestamp for when the response should continue
    continueResponseAt?: number
    throttleKbps?: number
  }
}

/** Driver Commands **/

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

interface Route {
  options: RouteMatcherOptions
  handler: RouteHandler
  hitCount: number
}

interface Request {
  responseHandler: HttpResponseInterceptor
}

let routes : { [key: string]: Route } = {}
let requests : { [key: string]: Request } = {}

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

export function registerCommands (Commands, Cypress, /** cy, state, config */) {
  // TODO: figure out what to do for XHR compatibility

  function _emit (eventName: string, ...args: any[]) {
    // all messages from driver to server are wrapped in backend:request
    return Cypress.backend('net', eventName, ...args) as Promise<any>
  }

  function _addRoute (options: RouteMatcherOptions, handler: RouteHandler) {
    const handlerId = _getUniqueId()

    const frame: NetEventFrames.AddRoute = {
      handlerId,
      routeMatcher: _annotateMatcherOptionsTypes(options),
    }

    switch (true) {
      case _isHttpRequestInterceptor(handler):
        break
      case _isWebSocketController(handler, options):
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
          return utils.throwErrByPath('net_stubbing.invalid_static_response', { args: { err, staticResponse: handler } })
        }

        frame.staticResponse = <StaticResponse>handler
        break
      default:
        return utils.throwErrByPath('net_stubbing.invalid_handler', { args: { handler } })
    }

    routes[handlerId] = {
      options,
      handler,
      hitCount: 0,
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
    .thenReturn(null)
  }

  function server () : void {

  }

  function _onRequestReceived (frame: NetEventFrames.HttpRequestReceived) {
    const route = routes[frame.routeHandlerId]
    const { req, requestId, routeHandlerId } = frame

    const continueFrame : Partial<NetEventFrames.HttpRequestContinue> = {
      routeHandlerId,
      requestId,
    }

    let nextCalled = false
    let replyCalled = false
    let continueSent = false

    const sendContinueFrame = () => {
      continueSent = true
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
          requests[requestId] = {
            responseHandler,
          }

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
    const request = requests[requestId]
    let sendCalled = false

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

  Cypress.on('test:before:run', () => {
    // wipe out callbacks and routes when tests start
    routes = {}
    Cypress.routes = routes
  })

  Cypress.on('net:event', (eventName, ...args) => {
    switch (eventName) {
      case 'http:request:received':
        _onRequestReceived(<NetEventFrames.HttpRequestReceived>args[0])
        break
      case 'http:response:received':
        _onResponseReceived(<NetEventFrames.HttpResponseReceived>args[0])
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
