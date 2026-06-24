import type { IncomingMessage } from 'http'
import type { Readable } from 'stream'
import type { ResourceType } from '../types/external-types'

/** Origin response handles for proxy streaming when {@link HttpResponse.body} is unset. */
export type PassthroughOriginResponse = {
  incomingRes: IncomingMessage
  stream: Readable
}

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
  resourceType?: ResourceType
  isSyncRequest?: boolean
  responseTimeout?: number
  followRedirect?: boolean
  /**
   * Set by a cy.intercept intercepter when at least one `cy.intercept` route matched.
   * Adapters copy this onto the transport request (e.g. proxy `hadIntercept`).
   */
  hadIntercept?: boolean
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
  delay?: number
  throttleKbps?: number
  /** Lazily read the origin response body when a handler must inspect or mutate it. */
  materializeResponseBody?: () => Promise<string | Buffer>
  /** Stream the origin response without buffering when {@link body} is unset. */
  consumePassthroughResponse?: () => PassthroughOriginResponse
}

export type OriginForwarder = (request: HttpRequest) => Promise<HttpResponse>

export type InterceptMiddleware = (
  request: HttpRequest,
  next: OriginForwarder,
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
