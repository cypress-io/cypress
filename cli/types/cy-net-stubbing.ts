export type CompatXHRHandler = (xhr: XMLHttpRequest /** ? */) => void

/**
 * HTTP request/response types.
 */
export namespace CyHttpMessages {
  interface BaseMessage {
    // as much stuff from `incomingmessage` as makes sense to serialize and send
    body?: any
    headers?: { [key: string]: string }
    url: string
    method?: string
    httpVersion?: string
  }

  export type IncomingResponse = BaseMessage & {
    error?: Error
    statusCode?: number
    statusMessage?: string
  }

  export type IncomingHttpResponse = IncomingResponse & {
    /**
     * Send a response with the supplied body and headers.
     */
    send(body: string, headers?: object): void
    /**
     * Sends the supplied `StaticResponse`.
     */
    send(staticResponse: StaticResponse): void
    /**
     * Continue the HTTP response to the browser, including any modifications made to `res`.
     */
    send(): void
    /**
     * Wait for `delayMs` milliseconds before sending the response to the client.
     */
    delay: (delayMs: number) => IncomingHttpResponse
    /**
     * Serve the response at `throttleKbps` kilobytes per second.
     */
    throttle: (throttleKbps: number) => IncomingHttpResponse
  }

  export type IncomingRequest = BaseMessage

  export interface IncomingHttpRequest extends IncomingRequest {
    destroy: () => void
    // if `responseOrInterceptor` is undefined, just forward the modified request to the destination
    reply: (responseOrInterceptor?: StaticResponse | HttpResponseInterceptor) => void
    redirect: (location: string, statusCode: 301 | 302 | 303 | 307 | number) => void
  }
}

// tslint:disable-next-line:no-empty-interface
export interface CyWebSocket {}

// tslint:disable-next-line:no-empty-interface
export interface CyWebSocketFrame {}

export interface DictMatcher<T> {
  [key: string]: T
}

/**
 * Matches a string using glob (`*`) matching.
 */
export type GlobPattern = string

export type HttpRequestInterceptor = (req: CyHttpMessages.IncomingHttpRequest, next: () => void) => void
export type HttpResponseInterceptor = (res: CyHttpMessages.IncomingHttpResponse, send?: () => void) => void

/**
 * Matches a single number or any of an array of acceptable numbers.
 */
export type NumberMatcher = number | number[]

export interface Request {
  req: CyHttpMessages.IncomingRequest
  responseHandler?: HttpResponseInterceptor
  /**
   * Was `cy.wait()` used to wait on the response to this request?
   */
  responseWaited: boolean
    /**
   * Was `cy.wait()` used to wait on this request?
   */
  requestWaited: boolean
  state: RequestState
  log: any // TODO: Cypress.Log
}

export enum RequestState {
  Received,
  Intercepted,
  ResponseReceived,
  ResponseIntercepted,
  Completed
}

export interface Route {
  alias?: string
  log: any // TODO: Cypress.Log
  options: RouteMatcherOptions
  handler: RouteHandler
  hitCount: number
  requests: { [key: string]: Request }
}

/**
 * A `RouteMatcher` describes a filter for HTTP requests.
 */
export type RouteMatcher = StringMatcher | RouteMatcherOptions

export interface RouteMatcherCompatOptions {
  onRequest?: CompatXHRHandler
  onResponse?: CompatXHRHandler
  response?: string | object
}

export type RouteMatcherOptions = RouteMatcherOptionsGeneric<StringMatcher>

export interface RouteMatcherOptionsGeneric<S> extends RouteMatcherCompatOptions {
  /**
   * Match HTTP basic authentication.
   */
  auth?: { username: S, password: S }
  /**
   * Match client request headers.
   */
  headers?: DictMatcher<S>
  /**
   * Match based on requested hostname.
   */
  hostname?: S
  /**
   * Match requests served via HTTPS only.
   */
  https?: boolean
  /**
   * @default 'GET'
   */
  method?: S
  /**
   * Match on request path after the hostname, including query params.
   */
  path?: S
  /**
   * Matches like `path`, but without query params.
   */
  pathname?: S
  /**
   * Match based on requested port.
   */
  port?: NumberMatcher
  /**
   * Match on parsed querystring parameters.
   */
  query?: DictMatcher<S>
  /**
   * Match based on full request URL.
   */
  url?: S
  webSocket?: boolean
}

export type RouteHandlerController = HttpRequestInterceptor | WebSocketController

export type RouteHandler = string | StaticResponse | RouteHandlerController

/**
 * Describes a response that will be sent back to the client.
 */
export interface StaticResponse {
  /**
   * @default ""
   */
  body?: string
  /**
   * @default {}
   */
  headers?: { [key: string]: string }
  /**
   * @default 200
   */
  statusCode?: number
  /**
   * If `destroySocket` is truthy, Cypress will destroy the connection to the browser and send no response. Useful for simulating a server that is not reachable. Must not be set in combination with other options.
   */
  destroySocket?: boolean
}

/**
 * Either a `GlobPattern` string or a `RegExp`.
 */
export type StringMatcher = GlobPattern | RegExp

export interface WebSocketController {
  onConnect?: (req: CyHttpMessages.IncomingRequest, socket: CyWebSocket) => void
  onIncomingFrame?: (socket: CyWebSocket, message: CyWebSocketFrame) => void
  onOutgoingFrame?: (socket: CyWebSocket, message: CyWebSocketFrame) => void
  onDisconnect?: (socket: CyWebSocket) => void

  transport: 'socket.io' // socket.io client over websockets
              | 'socket.io-longpolling' // socket.io client via longpolling
              | 'websockets' // vanilla websockets server
}
