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
    // an interface like the one brian proposed to make changes to the response
}

interface CyIncomingRequest {
    // as much stuff from `incomingmessage` as makes sense to serialize and send
}

type CyResponse = string | object
type CyInterceptor = (res: CyIncomingResponse, send?: () => void) => void

interface CyIncomingHTTPRequest extends CyIncomingRequest {
  // if `responseOrInterceptor` is undefined, just forward the modified request to the destination
  reply: (responseOrInterceptor?: CyResponse | CyInterceptor) => void

  // TODO: is this needed, when they could just do `setTimeout(()=>req.reply(), delayMs)`?
  // delay: (delayMs: number) => void
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

export interface AddRouteFrame {
  routeMatcher: AnnotatedRouteMatcherOptions
  staticResponse?: StaticResponse
  handlerId?: string
}

export interface BaseHttpFrame {
  requestId: string
}

export interface HttpRequestReceivedFrame extends BaseHttpFrame {
  req: CyIncomingHTTPRequest
}

export interface HttpRequestContinueFrame extends BaseHttpFrame {
  req: CyIncomingHTTPRequest
}

export interface StaticResponse {
  body?: string
  headers?: { [key: string]: string }
  statusCode?: number
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

let routes : { [key: string]: Route } = {}

function _addRoute(options: RouteMatcherOptions, handler: RouteHandler, emit: Function) : void {
  const handlerId = _getUniqueId()

  const frame: AddRouteFrame = {
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

  Cypress.on("test:before:run", () => {
    // wipe out callbacks and routes when tests start
    routes = {}
    Cypress.routes = routes
  })


  Commands.addAll({
    route,
    server
  })
}
