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
  body?: string | Buffer
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

/** Materialized response (MVP — matches SERIALIZABLE_RES_PROPS). */
export type HttpResponse = {
  statusCode: number
  statusMessage?: string
  headers: Record<string, string | string[]>
  body?: string | Buffer
  delay?: number
  throttleKbps?: number
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
