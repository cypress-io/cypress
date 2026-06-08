export type ResourceType = 'document' | 'fetch' | 'xhr' | 'websocket' | 'stylesheet' | 'script' | 'image' | 'font' | 'cspviolationreport' | 'ping' | 'manifest' | 'other'

/**
 * A dictionary/object matcher for matching key-value pairs.
 * Used for matching HTTP headers and query string parameters.
 * Keys are strings, values are of type T (typically a StringMatcher).
 */
interface DictMatcher<T> {
  [key: string]: T
}

/**
 * Matches a string using glob (`*`) matching.
 */
export type GlobPattern = string

/**
 * Matches a single number or any of an array of acceptable numbers.
 */
export type NumberMatcher = number | number[]

/**
 * Metadata for a subscription for an interception event.
 */
export interface Subscription {
  /**
   * If not defined, this is a default subscription.
   */
  id?: string
  routeId: string
  eventName: string
  await: boolean
  skip?: boolean
}

/**
 * A `RouteMatcher` describes a filter for HTTP requests.
 */
export type RouteMatcher = StringMatcher | RouteMatcherOptions

export type RouteMatcherOptions = RouteMatcherOptionsGeneric<StringMatcher>

export interface RouteMatcherOptionsGeneric<S> {
  /**
   * Match against the username and password used in HTTP Basic authentication.
   */
  auth?: { username: S, password: S }
  /**
   * Match against HTTP headers on the request.
   */
  headers?: DictMatcher<S>
  /**
   * Match against the requested HTTP hostname.
   */
  hostname?: S
  /**
   * If 'true', only HTTPS requests will be matched.
   * If 'false', only HTTP requests will be matched.
   */
  https?: boolean
  /**
   * Match against the request's HTTP method.
   * @default '*'
   */
  method?: S
  /**
   * If `true`, this handler will be called before any non-`middleware` handlers, in the order it was defined.
   * Can only be used with a dynamic request handler.
   * @default false
   */
  middleware?: boolean
  /**
   * Match on request path after the hostname, including query params.
   */
  path?: S
  /**
   * Matches like `path`, but without query params.
   */
  pathname?: S
  /**
   * Match based on requested port, or pass an array of ports
   * to match against any in that array.
   */
  port?: NumberMatcher
  /**
   * Match on parsed querystring parameters.
   */
  query?: DictMatcher<S>
  /**
   * Match on the request's resource type, according to the browser.
   */
  resourceType?: ResourceType | S
  /**
   * If set, this `RouteMatcher` will only match the first `times` requests.
   */
  times?: number
  /**
   * Match against the full request URL.
   * If a string is passed, it will be used as a substring match,
   * not an equality match.
   */
  url?: S
}

export type InterceptOptions = {
  /**
   * If set to `false`, matching requests will not be shown in the Command Log.
   * @default true
   */
  log?: boolean
}

export type StaticResponseWithOptions = StaticResponse & InterceptOptions

/**
 * Describes a response that will be sent back to the browser to fulfill the request.
 */
export type StaticResponse = GenericStaticResponse<string, string | object | boolean | ArrayBuffer | null>

export interface GenericStaticResponse<Fixture, Body> {
  /**
   * Serve a fixture as the response body.
   */
  fixture?: Fixture
  /**
   * Serve a static string/JSON object as the response body.
   */
  body?: Body
  /**
   * HTTP headers to accompany the response.
   * @default {}
   */
  headers?: { [key: string]: string }
  /**
   * The HTTP status code to send.
   * @default 200
   */
  statusCode?: number
  /**
   * If 'forceNetworkError' is truthy, Cypress will destroy the browser connection
   * and send no response. Useful for simulating a server that is not reachable.
   * Must not be set in combination with other options.
   */
  forceNetworkError?: boolean
  /**
   * Kilobytes per second to send 'body'.
   */
  throttleKbps?: number
  /**
   * Milliseconds to delay before the response is sent.
   */
  delay?: number
}

/**
 * Either a `GlobPattern` string or a `RegExp`.
 */
export type StringMatcher = GlobPattern | RegExp
