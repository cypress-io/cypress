import type { Readable } from 'stream'
import type { ResourceType } from '../types/external-types'

/** Transport-neutral request; adapter maps from CypressIncomingRequest or CDP Fetch pause. */
export type HttpRequest = {
  /** Adapter-owned id for an in-flight intercept (uuid, networkId, etc.). */
  inFlightInterceptId: string
  /** Forwarded to driver frames as browserRequestId when present. */
  browserRequestId?: string
  url: string
  method: string
  headers: Record<string, string | string[]>
  /**
   * Set only when the intercept stack replaces the request body.
   * When unset, the adapter passes the original request body through.
   */
  body?: string | Buffer
  /**
   * True once the request body was materialized or replaced. Adapters must send the
   * buffered body (which may be empty) instead of piping the incoming stream.
   */
  requestBodyMaterialized?: boolean
  /** Lazily read the incoming request body when a driver handler must inspect or mutate it. */
  materializeRequestBody?: () => Promise<string | Buffer | undefined>
  /**
   * When true, the origin forwarder should buffer the origin response body onto
   * {@link HttpResponse.body} before returning to the intercept layer.
   */
  materializeOriginResponse?: boolean
  resourceType?: ResourceType
  isSyncRequest?: boolean
  responseTimeout?: number
  followRedirect?: boolean
  /**
   * Set by a cy.intercept intercepter when at least one `cy.intercept` route matched.
   * Adapters copy this onto the transport request (e.g. proxy `hadIntercept`).
   */
  hadIntercept?: boolean
  /**
   * Browser-sent Accept-Encoding before proxy rewrite; used for driver-visible request headers.
   */
  browserAcceptEncoding?: string
}

/**
 * Intercept-layer response. {@link HttpResponse.body} absent means the origin body is unchanged;
 * empty string is an intentional replacement.
 */
export type HttpResponse = {
  statusCode: number
  statusMessage?: string
  headers: Record<string, string | string[]>
  /** Set only when the intercept stack replaces the response body. */
  body?: string | Buffer
  /**
   * Lowercase header names removed by a response-stage handler. Used to avoid re-inferring
   * Content-Type when a user intentionally deleted it.
   */
  deletedHeaders?: string[]
  delay?: number
  throttleKbps?: number
  /**
   * Returns a readable stream for the response body. Set by the proxy transport layer after
   * fetching the origin; consumers must not call this more than once per response lifecycle.
   * When `body` is set by an intercept handler, implementations must return a stream of `body`.
   */
  stream?: () => Promise<Readable>
  /**
   * Proxy adapter invokes after the response body has been written to the client.
   * Used to defer `after:response` driver subscriptions until `res` `finish`.
   */
  onResponseWrittenToClient?: () => Promise<void>
}

export interface ForOriginForwarding {
  (request: HttpRequest): Promise<HttpResponse>
}

export type InterceptMiddleware = (
  request: HttpRequest,
  next: ForOriginForwarding,
) => Promise<HttpResponse>

/**
 * Driving port: connection-agnostic middleware composer (proxy/CDP call {@link HttpIntercept.handle}).
 */
export interface ForHttpIntercept {
  handle: InterceptMiddleware
  use (middleware: InterceptMiddleware): void
}

/**
 * Transport adapters only need {@link ForHttpIntercept.handle}.
 */
export type ForNetworkInterception = Pick<ForHttpIntercept, 'handle'>
