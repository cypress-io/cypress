import { InterceptError } from '@packages/net-stubbing'
import * as errors from '@packages/server/lib/errors'

import type { HttpMiddleware } from '.'
import type { Readable } from 'stream'
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

const LogError: ErrorMiddleware = (ctx) => {
  ctx.debug('error proxying request %o', {
    error: ctx.error,
    url: ctx.req.url,
    headers: ctx.req.headers,
  })

  ctx.next()
}

const SendToDriver: ErrorMiddleware = (ctx) => {
  if (ctx.req.browserPreRequest) {
    ctx.socket.toDriver('request:event', 'request:error', {
      requestId: ctx.req.browserPreRequest.requestId,
      error: errors.cloneErr(ctx.error),
    })
  }

  ctx.next()
}

export const AbortRequest: ErrorMiddleware = (ctx) => {
  if (ctx.outgoingReq) {
    ctx.debug('aborting outgoingReq')
    ctx.outgoingReq.abort()
  }

  ctx.next()
}

export const UnpipeResponse: ErrorMiddleware = (ctx) => {
  if (ctx.incomingResStream) {
    ctx.debug('unpiping resStream from response')
    ctx.incomingResStream.unpipe()
  }

  ctx.next()
}

export const DestroyResponse: ErrorMiddleware = (ctx) => {
  ctx.res.destroy()
  ctx.end()
}

export default {
  LogError,
  SendToDriver,
  InterceptError,
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
}
