import Debug from 'debug'
import { getEncoding } from 'istextorbinary'
import _ from 'lodash'
import type { Readable } from 'stream'
import { concatStream, httpUtils } from '@packages/network'
import type {
  ResponseMiddleware,
} from '@packages/proxy'
import { CyHttpMessages, SERIALIZABLE_RES_PROPS } from '../../types'
import { getBodyStream, mergeDeletedHeaders, mergeWithPreservedBuffers } from '../util'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

export const InterceptResponse: ResponseMiddleware = async function () {
  const request = this.netStubbingState.requests[this.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(this.req, 'url'), request })

  if (!request) {
    // original request was not intercepted, nothing to do
    return this.next()
  }

  request.onResponse = (incomingRes, resStream) => {
    this.incomingRes = incomingRes

    request.continueResponse!(resStream)
  }

  request.continueResponse = (newResStream?: Readable) => {
    if (newResStream) {
      this.incomingResStream = newResStream.on('error', this.onError)
    }

    this.next()
  }

  this.makeResStreamPlainText()

  const body: Buffer | string = await new Promise<Buffer>((resolve) => {
    if (httpUtils.responseMustHaveEmptyBody(this.req, this.incomingRes)) {
      resolve(Buffer.from(''))
    } else {
      this.incomingResStream.pipe(concatStream(resolve))
    }
  })
  .then((buf) => {
    return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
  })

  const res = _.extend(_.pick(this.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: this.req.proxiedUrl,
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
