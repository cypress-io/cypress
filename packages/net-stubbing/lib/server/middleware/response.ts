import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import Debug from 'debug'
import { Readable } from 'stream'
import { getEncoding } from 'istextorbinary'

import {
  ResponseMiddleware,
} from '@packages/proxy'
import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
} from '../../types'
import {
  getBodyStream,
} from '../util'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

export const InterceptResponse: ResponseMiddleware = async function () {
  const request = this.netStubbingState.requests[this.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(this.req, 'url'), request })

  if (!request) {
    // original request was not intercepted, nothing to do
    return this.next()
  }

  request.incomingRes = this.incomingRes

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

  const modifiedRes = await request.handleSubscriptions<CyHttpMessages.IncomingResponse>({
    eventName: 'response',
    data: res,
    mergeChanges: (before, after) => {
      return _.merge(before, _.pick(after, SERIALIZABLE_RES_PROPS))
    },
  })

  _.merge(request.res, modifiedRes)

  const bodyStream = getBodyStream(modifiedRes.body, _.pick(modifiedRes, ['throttleKbps', 'delayMs']) as any)

  return request.continueResponse!(bodyStream)
}
