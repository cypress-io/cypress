// Copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/methods/index.d.ts
export type Method =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'
  | 'acl'
  | 'bind'
  | 'checkout'
  | 'connect'
  | 'copy'
  | 'delete'
  | 'get'
  | 'head'
  | 'link'
  | 'lock'
  | 'm-search'
  | 'merge'
  | 'mkactivity'
  | 'mkcalendar'
  | 'mkcol'
  | 'move'
  | 'notify'
  | 'options'
  | 'patch'
  | 'post'
  | 'propfind'
  | 'proppatch'
  | 'purge'
  | 'put'
  | 'rebind'
  | 'report'
  | 'search'
  | 'source'
  | 'subscribe'
  | 'trace'
  | 'unbind'
  | 'unlink'
  | 'unlock'
  | 'unsubscribe'

import type { CyHttpMessages, HttpRequestInterceptor } from './cy-http-messages'
import type {
  RouteMatcher,
  RouteMatcherOptions,
  StaticResponseWithOptions,
  StringMatcher,
  Subscription,
} from '@packages/network-interception/lib/types/external-types'

/**
 * Request/response cycle.
 */
export interface Interception<TRequest = any, TResponse = any> {
  id: string
  /* @internal */
  browserRequestId?: string
  routeId: string
  /* @internal */
  setLogFlag: (flag: 'spied' | 'stubbed' | 'reqModified' | 'resModified') => void
  request: CyHttpMessages.IncomingRequest<TRequest>
  /**
   * Was `cy.wait()` used to wait on this request?
   * @internal
   */
  requestWaited: boolean
  response?: CyHttpMessages.IncomingResponse<TResponse>
  /**
   * The error that occurred during this request.
   */
  error?: Error
  /**
   * Was `cy.wait()` used to wait on the response to this request?
   * @internal
   */
  responseWaited: boolean
  /* @internal */
  state: InterceptionState
  /* @internal */
  subscriptions: Array<{
    subscription: Subscription
    handler: (data: any) => Promise<void> | void
  }>
}

export type InterceptionState =
  'Received' |
  'Intercepted' |
  'ResponseReceived' |
  'ResponseIntercepted' |
  'Complete' |
  'Errored'

export interface Route<TRequest = any, TResponse = any> {
  alias?: string
  log: any
  options: RouteMatcherOptions
  handler: RouteHandler<TRequest, TResponse>
  hitCount: number
  requests: { [key: string]: Interception<TRequest, TResponse> }
  command: any
}

export interface RouteMap<TRequest = any, TResponse = any> { [key: string]: Route<TRequest, TResponse> }

type RouteHandlerController<TRequest = any, TResponse = any> = HttpRequestInterceptor<TRequest, TResponse>

export type RouteHandler<TRequest = any, TResponse = any> = string | StaticResponseWithOptions | RouteHandlerController<TRequest, TResponse> | object

interface WaitOptions {
  log: boolean
  requestTimeout: number
  responseTimeout: number
  timeout: number
}

declare global {
  namespace Cypress {
    // TODO: Why is Subject unused?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject = any> {
      intercept<TRequest = any, TResponse = any>(url: RouteMatcher, response?: RouteHandler<TRequest, TResponse>): Chainable<null>
      intercept<TRequest = any, TResponse = any>(method: Method, url: RouteMatcher, response?: RouteHandler<TRequest, TResponse>): Chainable<null>
      intercept<TRequest = any, TResponse = any>(url: StringMatcher, mergeRouteMatcher: Omit<RouteMatcherOptions, 'url'>, response: RouteHandler<TRequest, TResponse>): Chainable<null>
      wait<TRequest = any, TResponse = any>(alias: `@${string}`, options?: Partial<WaitOptions>): Chainable<Interception<TRequest, TResponse>>
      wait(aliases: `@${string}`[], options?: Partial<WaitOptions>): Chainable<Interception[]>
    }
  }
}
