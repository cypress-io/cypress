import * as errors from '@packages/server/lib/errors'

import type { HttpMiddleware } from '.'
import type { Readable } from 'stream'
import { InterceptError } from '@packages/net-stubbing'
import type { Request } from '@cypress/request'

// do not use a debug namespace in this file - use the per-request `this.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

export type ErrorMiddleware = HttpMiddleware<{
  error: Error
  incomingResStream?: Readable
  outgoingReq?: Request
}>

const LogError: ErrorMiddleware = function () {
  this.debug('error proxying request %o', {
    error: this.error,
    url: this.req.url,
    headers: this.req.headers,
  })

  this.next()
}

const SendToDriver: ErrorMiddleware = function () {
  if (this.req.browserPreRequest) {
    this.socket.toDriver('request:event', 'request:error', {
      requestId: this.req.browserPreRequest.requestId,
      error: errors.cloneErr(this.error),
    })
  }

  this.next()
}

export const AbortRequest: ErrorMiddleware = function () {
  if (this.outgoingReq) {
    this.debug('aborting outgoingReq')
    this.outgoingReq.abort()
  }

  this.next()
}

export const UnpipeResponse: ErrorMiddleware = function () {
  if (this.incomingResStream) {
    this.debug('unpiping resStream from response')
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
  SendToDriver,
  InterceptError,
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
}
