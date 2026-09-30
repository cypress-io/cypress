import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import Debug from 'debug'
import type { Readable } from 'stream'
import { getEncoding } from 'istextorbinary'
import type { ResponseMiddleware } from '@packages/proxy'
import {
  SERIALIZABLE_RES_PROPS,
  isValidStatusCode,
  isValidStatusMessage,
  mergeDeletedHeaders,
  mergeWithPreservedBuffers,
} from '@packages/network-interception'
import type { CyHttpMessages } from '@packages/network-interception'
import { getBodyStream } from './util'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

type InterceptResponseMiddleware = ResponseMiddleware extends (this: infer T) => any ? T : never

/**
 * Headers reach the client because `res.headers` is the same object as
 * `incomingRes.headers` and is merged in place; `statusCode` and
 * `statusMessage` are primitives, so they must be copied back explicitly.
 */
function applyStatusChanges (incomingRes: InterceptResponseMiddleware['incomingRes'], modifiedRes: CyHttpMessages.IncomingResponse) {
  const { statusCode, statusMessage } = modifiedRes

  // The driver rejects invalid values first; this keeps one that slips past
  // from making Node throw mid-response.
  if (!isValidStatusCode(statusCode) || (statusMessage != null && !isValidStatusMessage(statusMessage))) {
    debug('ignoring invalid status from response handler %o', { statusCode, statusMessage })

    return
  }

  const statusCodeChanged = statusCode !== incomingRes.statusCode
  const statusMessageChanged = statusMessage !== incomingRes.statusMessage

  if (statusCodeChanged) {
    incomingRes.statusCode = statusCode
  }

  if (statusMessageChanged) {
    incomingRes.statusMessage = statusMessage
  } else if (statusCodeChanged) {
    // The origin's reason phrase describes the origin's status. Clearing it lets
    // the default phrase for the new status apply, as with `res.send({ statusCode })`.
    incomingRes.statusMessage = ''
  }
}

/**
 * Legacy response intercept orchestration — invoked via {@link ForResponseInterception}.
 */
export async function handleInterceptResponse (mw: InterceptResponseMiddleware): Promise<void> {
  const request = mw.netStubbingState.requests[mw.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(mw.req, 'url'), request })

  if (!request) {
    return mw.next()
  }

  request.onResponse = (incomingRes, resStream) => {
    mw.incomingRes = incomingRes

    request.continueResponse!(resStream)
  }

  request.continueResponse = (newResStream?: Readable) => {
    if (newResStream) {
      mw.incomingResStream = newResStream.on('error', mw.onError)
    }

    mw.next()
  }

  mw.makeResStreamPlainText()

  const body: Buffer | string = await new Promise<Buffer>((resolve) => {
    if (httpUtils.responseMustHaveEmptyBody(mw.req, mw.incomingRes)) {
      resolve(Buffer.from(''))
    } else {
      mw.incomingResStream.pipe(concatStream(resolve))
    }
  })
  .then((buf) => {
    return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
  })

  const res = _.extend(_.pick(mw.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: mw.req.proxiedUrl,
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

  applyStatusChanges(mw.incomingRes, modifiedRes)

  const bodyStream = await getBodyStream(modifiedRes.body, _.pick(modifiedRes, ['throttleKbps', 'delay']) as any)

  return request.continueResponse!(bodyStream)
}
