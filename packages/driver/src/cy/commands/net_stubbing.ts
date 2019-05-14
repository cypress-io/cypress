import * as _ from 'lodash'

type GlobPattern = string
type StringMatcher = GlobPattern | RegExp
type DictMatcher<T> = { [key: string]: T }
type NumberMatcher = number | number[] // list of acceptable numbers

interface AnnotatedStringMatcher {
  type: 'regex' | 'glob'
  value: string
}

// all HTTP requests have some basic information
// users would use a `RouteMatcher` to "subscribe" to a certain subset of requests

// no callbacks are supported in matchers - helps cut down on un-needed back-and-forth
// websocket requests to match requests - they are all static

// then, the route is handled by a `RouteHandler`, which will either return a static response
// or send a callback to the driver, where it will be handled

// if no `RouteHandler` is set, it just passes through after following the options
/** Types for Route Matching **/

type RouteMatcher = StringMatcher | RouteMatcherOptions

interface RouteMatcherOptionsGeneric<S> extends RouteMatcherCompatOptions {
  auth?: { username: S, password: S }
  headers?: DictMatcher<S>
  hostname?: S
  https?: boolean // serve this over HTTPS
  method?: S // defaults to GET
  path?: S // includes query params
  pathname?: S // does not include query params
  port?: NumberMatcher
  query?: DictMatcher<S> // match querystring values
  url?: S
  webSocket?: boolean
}

export type RouteMatcherOptions = RouteMatcherOptionsGeneric<StringMatcher>

export type AnnotatedRouteMatcherOptions = RouteMatcherOptionsGeneric<AnnotatedStringMatcher>

type CompatXHRHandler = (xhr: XMLHttpRequest /** ? */) => void

interface RouteMatcherCompatOptions {
  onRequest?: CompatXHRHandler
  onResponse?: CompatXHRHandler
  response?: string | object
}

/** Types for Route Responses **/

interface CyIncomingResponse {
  /**
   * Wait for `delayMs` milliseconds before sending the response to the client.
   */
  delay: (delayMs: number) => CyIncomingResponse
  /**
   * Serve the response at a maximum of `throttleKbps` kilobytes per second.
   */
  throttle: (throttleKbps: number) => CyIncomingResponse
}

interface CyIncomingResponseOptions {
  delayMs?: number
}

interface CyIncomingRequest {
  // as much stuff from `incomingmessage` as makes sense to serialize and send
  headers: { [key: string]: string }
  body: any
}

export interface StaticResponse {
  body?: string
  headers?: { [key: string]: string }
  statusCode?: number
}

type CyResponseInterceptor = (res: CyIncomingResponse, send?: () => void) => void

interface CyIncomingHTTPRequest extends CyIncomingRequest {
  // if `responseOrInterceptor` is undefined, just forward the modified request to the destination
  reply: (responseOrInterceptor?: StaticResponse | CyResponseInterceptor) => void
  redirect: (location: string, statusCode: 301 | 302 | 303 | 307 | number) => void
}

type HTTPController = (req: CyIncomingHTTPRequest, next: () => void) => void

interface CyWebSocket {

}

interface CyWebSocketFrame {

}

interface WebSocketController {
  onConnect?: (req: CyIncomingRequest, socket: CyWebSocket) => void
  onIncomingFrame?: (socket: CyWebSocket, message: CyWebSocketFrame) => void
  onOutgoingFrame?: (socket: CyWebSocket, message: CyWebSocketFrame) => void
  onDisconnect?: (socket: CyWebSocket) => void

  transport: 'socket.io'  // socket.io client over websockets
              | 'socket.io-longpolling' // socket.io client via longpolling
              | 'websockets' // vanilla websockets server
}

type RouteHandlerController = HTTPController | WebSocketController

type RouteHandler = string | object | RouteHandlerController

/** Types for messages between driver and server */

export namespace NetEventMessages {
  export interface AddRouteFrame {
    routeMatcher: AnnotatedRouteMatcherOptions
    staticResponse?: StaticResponse
    handlerId?: string
  }

  export interface BaseHttpFrame {
    requestId: string
    routeHandlerId: string
  }

  export interface HttpRequestReceivedFrame extends BaseHttpFrame {
    req: CyIncomingRequest
  }

  export interface HttpRequestContinueFrame extends BaseHttpFrame {
    req?: CyIncomingRequest
    staticResponse?: StaticResponse
    hasResponseHandler?: boolean
    responseOptions?: CyIncomingResponseOptions
    tryNextRoute?: boolean
  }
}

/** Driver Commands **/

/**
 * Annotate non-primitive types so that they can be passed to the backend and re-hydrated.
 */
function _annotateMatcherOptionsTypes(options: RouteMatcherOptions) {
  const dictStringMatcherFields = ['headers', 'query']
  const stringMatcherFields = ['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url']
  .concat(
    // add the nested DictStringMatcher values to the list of fields to annotate
    _.flatten(
      _.filter(
        dictStringMatcherFields.map(field => {
          const value = options[field]

          if (value) {
            return _.keys(value).map(key => {
              return `${field}.${key}`
            })
          }

          return ''
        })
      )
    )
  )

  const ret : AnnotatedRouteMatcherOptions = {}

  stringMatcherFields.forEach(field => {
    const value = _.get(options, field)

    if (value) {
      _.set(ret, field, {
        type: (_isRegExp(value)) ? 'regex' : 'glob',
        value: value.toString()
      } as AnnotatedStringMatcher)
    }
  })

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']
  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

function _getUniqueId() {
  return `${Number(new Date()).toString()}-${_.uniqueId()}`
}

function _isHttpController(obj) : obj is HTTPController {
  return typeof obj === 'function'
}

function _isWebSocketController(obj, options) : obj is WebSocketController {
  return typeof obj === 'object' && options.webSocket === true
}

function _isRegExp(obj) : obj is RegExp {
  return obj && (obj instanceof RegExp || obj.__proto__ === RegExp.prototype || obj.__proto__.constructor.name === 'RegExp')
}

interface Route {
  options: RouteMatcherOptions
  handler: RouteHandler
  hitCount: number
}

interface Request {
  responseHandler: CyResponseInterceptor
}

let routes : { [key: string]: Route } = {}
let requests : { [key: string]: Request } = {}

function _addRoute(options: RouteMatcherOptions, handler: RouteHandler, emit: Function) : void {
  const handlerId = _getUniqueId()

  const frame: NetEventMessages.AddRouteFrame = {
    handlerId,
    routeMatcher: _annotateMatcherOptionsTypes(options),
  }

  switch (true) {
    case _isHttpController(handler):
      break
    case _isWebSocketController(handler, options):
      break
    case typeof handler === 'string':
      frame.staticResponse = { body: <string>handler }
    break
    case typeof handler === 'object':
      // TODO: automatically JSONify staticResponse.body objects
      frame.staticResponse = <StaticResponse>handler
      break
    default:
      // TODO: warn that only string, object, HttpController, or WebSocketController allowed
  }

  routes[handlerId] = {
    options,
    handler,
    hitCount: 0
  }

  emit("route:added", frame)
}

export function registerCommands(Commands, Cypress, /** cy, state, config */) {
  // TODO: figure out what to do for XHR compatibility

  function _emit(eventName: string, ...args: any[]) {
    // all messages from driver to server are wrapped in backend:request
    Cypress.backend("net", eventName, ...args)
  }

  function route(matcher: RouteMatcher, handler: RouteHandler) {
    let options : RouteMatcherOptions

    if (matcher instanceof RegExp || typeof matcher === 'string') {
      options = {
        url: matcher
      }
    } else {
      options = matcher
    }

    _addRoute(options, handler, _emit)
  }

  function server() : void {

  }

  function _onRequestReceived(frame: NetEventMessages.HttpRequestReceivedFrame) {
    // TODO: add some vanity methods to the CyIncomingHttpRequest and pass it to the cb
    const route = routes[frame.routeHandlerId]
    const { req, requestId, routeHandlerId } = frame

    const continueFrame : NetEventMessages.HttpRequestContinueFrame = {
      routeHandlerId,
      requestId
    }

    const sendContinueFrame = () => {
      // copy changeable attributes of userReq to req in frame
      continueFrame.req = {
        ..._.pick(userReq, 'body', 'headers')
      }
      _emit('http:request:continue', continueFrame)
    }

    const userReq : CyIncomingHTTPRequest = {
      ...req,
      reply: function (responseHandler) {
        // TODO: this can only be called once
        if (_.isFunction(responseHandler)) {
          // allow `req` to be sent outgoing, then pass the response body to `responseHandler`
          requests[requestId] = {
            responseHandler
          }
          continueFrame.hasResponseHandler = true
        } else if (!_.isUndefined(responseHandler)) {
          // `replyHandler` is a StaticResponse
          continueFrame.staticResponse = <StaticResponse>responseHandler
        }
        // if `replyHandler` is null, response doesn't need to come back to the driver
        sendContinueFrame()
      },
      redirect: function (location, statusCode = 302) {
        this.reply({
          headers: { location },
          statusCode
        })
      }
    }

    if (!route) {
      // TODO: remove this logging once we're done
      console.log('no handler for frame', { frame })
      return sendContinueFrame()
    }

    const { handler } = route

    if ((<Function>handler).length === 2) {
      // next() will be called to pass this to the next route
      const next = () => {
        // TODO: this can only be called once
        continueFrame.tryNextRoute = true
        sendContinueFrame()
      }

      return (<Function>handler)(req, next)
    }

    // req.reply must be used in handler to complete the route
    return (<Function>handler)(req)
  }

  Cypress.on("test:before:run", () => {
    // wipe out callbacks and routes when tests start
    routes = {}
    Cypress.routes = routes
  })

  Cypress.on("net:event", (eventName, ...args) => {
    switch (eventName) {
      case 'http:request:received':
        _onRequestReceived(<NetEventMessages.HttpRequestReceivedFrame>args[0])
        break
      case 'http:response:received':
        break
      case 'ws:connect':
        break
      case 'ws:disconnect':
        break
      case 'ws:frame:outgoing':
        break
      case 'ws:frame:incoming':
        break
    }
  })


  Commands.addAll({
    route,
    server
  })
}
