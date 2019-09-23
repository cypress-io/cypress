import { Readable } from 'stream'
import { Request, Response } from 'express'

/**
 * An incoming request to the Cypress web server.
 */
export type CypressIncomingRequest = Request & {
  // TODO: what's this difference from req.url? is it only for non-proxied requests?
  proxiedUrl: string
  abort: () => void // TODO: is this in the right place?
  webSocket: boolean // TODO: populate
  requestId: string
  body?: string
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
