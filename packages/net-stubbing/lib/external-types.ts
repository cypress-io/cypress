/**
 * HTTP request/response types.
 */
export namespace CyHttpMessages {
  interface BaseMessage {
    // as much stuff from `incomingmessage` as makes sense to serialize and send
    body?: any
    headers: { [key: string]: string }
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
    destroy(): void
    reply(interceptor?: StaticResponse | HttpResponseInterceptor): void
    reply(body: string | number | object, headers?: { [key: string]: string }): void
    reply(status: number, body: string | number | object, headers?: { [key: string]: string }): void
    redirect(location: string, statusCode: number): void
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
  log: any
}

export type RequestState =
  'Received' |
  'Intercepted' |
  'ResponseReceived' |
  'ResponseIntercepted' |
  'Complete'

export interface Route {
  alias?: string
  log: any
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
}

export type RouteHandlerController = HttpRequestInterceptor

export type RouteHandler = string | StaticResponse | RouteHandlerController | object

/**
 * Describes a response that will be sent back to the browser to fulfill the request.
 */
export type StaticResponse = GenericStaticResponse<string, string | object>

export interface GenericStaticResponse<Fixture, Body> {
  /**
   * If set, serve a fixture as the response body.
   */
  fixture?: Fixture
  /**
   * If set, serve a static string/JSON object as the response body.
   */
  body?: Body
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

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      route2(url: RouteMatcher, response?: RouteHandler): Chainable<null>
      route2(method: string, url: RouteMatcher, response?: RouteHandler): Chainable<null>
    }
  }
}
