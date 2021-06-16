import { Readable } from 'stream'
import { Request, Response } from 'express'

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
}

/**
 * An outgoing response to an incoming request to the Cypress web server.
 */
export type CypressOutgoingResponse = Response & {
  isInitial: null | boolean
  wantsInjection: 'full' | 'partial' | false
  wantsSecurityRemoved: null | boolean
  body?: string | Readable
}

export { ErrorMiddleware } from './http/error-middleware'

export { RequestMiddleware } from './http/request-middleware'

export { ResponseMiddleware } from './http/response-middleware'

export type ResourceType = 'fetch' | 'xhr' | 'websocket' | 'stylesheet' | 'script' | 'image' | 'font' | 'cspviolationreport' | 'ping' | 'manifest' | 'other'

/**
 * Metadata about an HTTP request, according to the browser's pre-request event.
 */
export type BrowserPreRequest = {
  requestId: string
  method: string
  url: string
  resourceType: ResourceType
  originalResourceType: string | undefined
}
