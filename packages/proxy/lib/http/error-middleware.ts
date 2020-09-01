import debugModule from 'debug'
import { HttpMiddleware } from '.'
import { InterceptError } from '@packages/net-stubbing'
import { Readable } from 'stream'
import { Request } from '@cypress/request'

const debug = debugModule('cypress:proxy:http:error-middleware')

export type ErrorMiddleware = HttpMiddleware<{
  error: Error
  incomingResStream?: Readable
  outgoingReq?: Request
}>

const LogError: ErrorMiddleware = function () {
  debug('error proxying request %o', {
    error: this.error,
    url: this.req.url,
    headers: this.req.headers,
  })

  this.next()
}

export const AbortRequest: ErrorMiddleware = function () {
  if (this.outgoingReq) {
    debug('aborting outgoingReq')
    this.outgoingReq.abort()
  }

  this.next()
}

export const UnpipeResponse: ErrorMiddleware = function () {
  if (this.incomingResStream) {
    debug('unpiping resStream from response')
    this.incomingResStream.unpipe()
  }

  this.next()
}

export const DestroyResponse: ErrorMiddleware = function () {
  this.res.destroy()
  this.end()
}

export default {
  LogError,
  InterceptError,
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
}
