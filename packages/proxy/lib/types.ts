import type { Readable } from 'stream'
import type { Request, Response } from 'express'

/**
 * An incoming request to the Cypress web server.
 */
export type CypressIncomingRequest = Request & {
  proxiedUrl: string
  abort: () => void
  requestId: string
  browserPreRequest?: BrowserPreRequest
  body?: string
  responseTimeout?: number
  followRedirect?: boolean
  isAUTFrame: boolean
  requestedWith?: RequestResourceType
  credentialsLevel?: RequestCredentialLevel
}

export type RequestResourceType = 'fetch' | 'xhr'

export type RequestCredentialLevel = 'same-origin' | 'include' | 'omit' | boolean

export type CypressWantsInjection = 'full' | 'fullCrossOrigin' | 'partial' | false

/**
 * An outgoing response to an incoming request to the Cypress web server.
 */
export type CypressOutgoingResponse = Response & {
  isInitial: null | boolean
  wantsInjection: CypressWantsInjection
  wantsSecurityRemoved: null | boolean
  body?: string | Readable
}

export { ErrorMiddleware } from './http/error-middleware'

export { RequestMiddleware } from './http/request-middleware'

export { ResponseMiddleware } from './http/response-middleware'

export type ResourceType = 'document' | 'fetch' | 'xhr' | 'websocket' | 'stylesheet' | 'script' | 'image' | 'font' | 'cspviolationreport' | 'ping' | 'manifest' | 'other'

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
}

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
