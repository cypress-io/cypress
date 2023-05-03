import Debug from 'debug'
import { getEncoding } from 'istextorbinary'
import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import { CyHttpMessages, SERIALIZABLE_RES_PROPS } from '../../types'
import { getBodyStream, mergeDeletedHeaders, mergeWithPreservedBuffers } from '../util'

import type { Readable } from 'stream'
import type {
  ResponseMiddleware,
} from '@packages/proxy'
const debug = Debug('cypress:net-stubbing:server:intercept-response')

export const InterceptResponse: ResponseMiddleware = async (ctx) => {
  const request = ctx.netStubbingState.requests[ctx.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(ctx.req, 'url'), request })

  if (!request) {
    // original request was not intercepted, nothing to do
    return ctx.next()
  }

  request.onResponse = (incomingRes, resStream) => {
    ctx.incomingRes = incomingRes

    request.continueResponse!(resStream)
  }

  request.continueResponse = (newResStream?: Readable) => {
    if (newResStream) {
      ctx.incomingResStream = newResStream.on('error', ctx.onError)
    }

    ctx.next()
  }

  ctx.makeResStreamPlainText()

  const body: Buffer | string = await new Promise<Buffer>((resolve) => {
    if (httpUtils.responseMustHaveEmptyBody(ctx.req, ctx.incomingRes)) {
      resolve(Buffer.from(''))
    } else {
      ctx.incomingResStream.pipe(concatStream(resolve))
    }
  })
  .then((buf) => {
    return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
  })

  const res = _.extend(_.pick(ctx.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: ctx.req.proxiedUrl,
    body,
  }) as CyHttpMessages.IncomingResponse

  if (!_.isString(res.body) && !_.isBuffer(res.body)) {
    throw new Error('res.body must be a string or a Buffer')
  }

  const mergeChanges = (before: CyHttpMessages.IncomingResponse, after: CyHttpMessages.IncomingResponse) => {
    mergeWithPreservedBuffers(before, _.pick(after, SERIALIZABLE_RES_PROPS))

    mergeDeletedHeaders(before, after)
  }

  const modifiedRes = await request.handleSubscriptions<CyHttpMessages.IncomingResponse>({
    eventName: ['before:response', 'response:callback', 'response'],
    data: res,
    mergeChanges,
  })

  mergeChanges(request.res as any, modifiedRes)

  const bodyStream = await getBodyStream(modifiedRes.body, _.pick(modifiedRes, ['throttleKbps', 'delay']) as any)

  return request.continueResponse!(bodyStream)
}
