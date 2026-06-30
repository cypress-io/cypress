import type { Readable } from 'stream'
import type { Request, Response } from 'express'
import type { ProxyTimings } from '@packages/types'
import type { BackendRoute } from '@packages/network-interception'
import type { Protocol } from 'devtools-protocol'
import type { RequestCredentialLevel, ResourceType } from './resourceTypeAndCredentialManager'

/**
 * An incoming request to the Cypress web server.
 */
export type CypressIncomingRequest = Request & {
  proxiedUrl: string
  abort: () => void
  requestId: string
  browserPreRequest?: BrowserPreRequestWithTimings
  noPreRequestExpected?: boolean
  body?: string
  responseTimeout?: number
  followRedirect?: boolean
  isAUTFrame: boolean
  credentialsLevel?: RequestCredentialLevel
  isFromExtraTarget: boolean
  /**
   * Resource type from browserPreRequest. Copied to req so intercept matching can work.
   */
  resourceType?: ResourceType
  /**
   * Stack-ordered list of `cy.intercept()`s matching this request.
   */
  matchingRoutes?: BackendRoute[]
  isSyncRequest: boolean
  /** Set when cy.intercept applied during ApplyHttpInterception. */
  hadIntercept?: boolean
  /** Accept-Encoding from the browser before proxy rewrite for driver-visible headers. */
  originalAcceptEncoding?: string
  /**
   * True once the incoming request body was read via concatStream (or replaced by intercept).
   * When true, {@link sendRequestOutgoing} must send the buffered body and must not pipe.
   */
  requestBodyMaterialized?: boolean
  /**
   * Invoked on `res` `finish` to run deferred `after:response` driver subscriptions.
   */
  onInterceptResponseWritten?: () => Promise<void>
}

export type CypressWantsInjection = 'full' | 'fullCrossOrigin' | 'partial' | false

/**
 * An outgoing response to an incoming request to the Cypress web server.
 */
export type CypressOutgoingResponse = Response & {
  injectionNonce?: string
  isInitial: null | boolean
  wantsInjection: CypressWantsInjection
  wantsSecurityRemoved: null | boolean
  body?: string | Readable
}

export { ErrorMiddleware } from './http/error-middleware'

export { RequestMiddleware } from './http/request-middleware'

export { ResponseMiddleware } from './http/response-middleware'

export { ResourceType }

/**
 * Metadata about an HTTP request, according to the browser's pre-request event.
 */
export type BrowserPreRequest = {
  requestId: string
  method: string
  url: string
  headers: { [key: string]: string | string[] }
  resourceType: ResourceType
  originalResourceType: string | undefined
  errorHandled?: boolean
  initiator?: Protocol.Network.Initiator
  documentURL?: string
  hasRedirectResponse?: boolean
  cdpRequestWillBeSentTimestamp?: number
  cdpRequestWillBeSentReceivedTimestamp?: number
}

export type BrowserPreRequestWithTimings = BrowserPreRequest & ProxyTimings

/**
 * Notification that the browser has received a response for a request for which a pre-request may have been emitted.
 */
export type BrowserResponseReceived = {
  requestId: string
  status: number
  headers: { [key: string]: string | string[] }
}

export type RequestError = {
  requestId: string
  error: any
}
