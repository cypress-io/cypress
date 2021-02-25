import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import Debug from 'debug'
import { Readable, PassThrough } from 'stream'

import {
  ResponseMiddleware,
} from '@packages/proxy'
import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
} from '../types'
import {
  getBodyStream,
} from './util'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

export const InterceptResponse: ResponseMiddleware = async function () {
  const backendRequest = this.netStubbingState.requests[this.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(this.req, 'url'), backendRequest })

  if (!backendRequest) {
    // original request was not intercepted, nothing to do
    return this.next()
  }

  backendRequest.incomingRes = this.incomingRes

  backendRequest.onResponse = (incomingRes, resStream) => {
    this.incomingRes = incomingRes

    backendRequest.continueResponse!(resStream)
  }

  backendRequest.continueResponse = (newResStream?: Readable) => {
    if (newResStream) {
      this.incomingResStream = newResStream.on('error', this.onError)
    }

    this.next()
  }

  this.makeResStreamPlainText()

  const body = await new Promise((resolve) => {
    if (httpUtils.responseMustHaveEmptyBody(this.req, this.incomingRes)) {
      resolve('')
    } else {
      this.incomingResStream.pipe(concatStream((resBody) => {
        resolve(resBody)
      }))
    }
  })

  const pt = this.incomingResStream = new PassThrough()

  pt.end(body)

  const res = _.extend(_.pick(this.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: this.req.proxiedUrl,
    body: String(body),
  }) as CyHttpMessages.IncomingResponse

  const modifiedRes = await backendRequest.handleSubscriptions<CyHttpMessages.IncomingResponse>({
    eventName: 'response',
    data: res,
    mergeChanges: (before, after) => {
      return _.assign(before, _.pick(after, SERIALIZABLE_RES_PROPS))
    },
  })

  _.assign(backendRequest.res, modifiedRes)

  const bodyStream = getBodyStream(res.body, _.pick(modifiedRes, ['throttleKbps', 'delay']) as any)

  return backendRequest.continueResponse!(bodyStream)
}
