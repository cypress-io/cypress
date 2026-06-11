import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import Debug from 'debug'
import { PassThrough } from 'stream'
import type { Readable } from 'stream'
import { getEncoding } from 'istextorbinary'
import type { ResponseMiddleware } from '@packages/proxy'
import {
  CyHttpMessages,
  SERIALIZABLE_RES_PROPS,
} from '../types'
import {
  getBodyStream,
  mergeDeletedHeaders,
  mergeWithPreservedBuffers,
} from './util'
import type { InterceptedRequest } from './intercepted-request'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

type InterceptResponseMiddleware = ResponseMiddleware extends (this: infer T) => any ? T : never

const RESPONSE_EVENT_NAMES = ['before:response', 'response:callback', 'response']

const decodeBody = (buf: Buffer): Buffer | string => {
  return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
}

const mergeChanges = (before: CyHttpMessages.IncomingResponse, after: CyHttpMessages.IncomingResponse) => {
  mergeWithPreservedBuffers(before, _.pick(after, SERIALIZABLE_RES_PROPS))

  mergeDeletedHeaders(before, after)
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

  const resMustHaveEmptyBody = httpUtils.responseMustHaveEmptyBody(mw.req, mw.incomingRes)

  if (!resMustHaveEmptyBody && !request.hasAwaitedSubscription(RESPONSE_EVENT_NAMES)) {
    return handleResponseNotificationsLazily(mw, request)
  }

  const body: Buffer | string = await new Promise<Buffer>((resolve) => {
    if (resMustHaveEmptyBody) {
      resolve(Buffer.from(''))
    } else {
      mw.incomingResStream.pipe(concatStream(resolve))
    }
  })
  .then(decodeBody)

  const res = _.extend(_.pick(mw.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: mw.req.proxiedUrl,
    body,
  }) as CyHttpMessages.IncomingResponse

  if (!_.isString(res.body) && !_.isBuffer(res.body)) {
    throw new Error('res.body must be a string or a Buffer')
  }

  const modifiedRes = await request.handleSubscriptions<CyHttpMessages.IncomingResponse>({
    eventName: RESPONSE_EVENT_NAMES,
    data: res,
    mergeChanges,
  })

  mergeChanges(request.res as any, modifiedRes)

  const bodyStream = await getBodyStream(modifiedRes.body, _.pick(modifiedRes, ['throttleKbps', 'delay']) as any)

  return request.continueResponse!(bodyStream)
}

/**
 * When no subscription awaits the response events, no handler can modify the response, so
 * there is no need to hold the response back from the browser while the body is buffered.
 * Stream the response through immediately and buffer the body in the background, emitting
 * the fire-and-forget driver notifications (e.g. for a spy's `cy.wait` interception) once
 * the body is available.
 *
 * `pendingResponseNotifications` is awaited before `after:response` is emitted, preserving
 * the event order the driver expects.
 */
function handleResponseNotificationsLazily (mw: InterceptResponseMiddleware, request: InterceptedRequest): void {
  // snapshot the serializable response fields now - response middleware further down the
  // chain can mutate `incomingRes` before the body has been fully buffered
  const res = _.cloneDeep(_.extend(_.pick(mw.incomingRes, SERIALIZABLE_RES_PROPS), {
    url: mw.req.proxiedUrl,
    body: '',
  })) as CyHttpMessages.IncomingResponse

  const resStream = new PassThrough()
  const bufferStream = new PassThrough()

  mw.incomingResStream.pipe(resStream)
  mw.incomingResStream.pipe(bufferStream)

  request.pendingResponseNotifications = new Promise<Buffer>((resolve) => {
    bufferStream.pipe(concatStream(resolve))
  })
  .then(async (buf) => {
    res.body = decodeBody(buf)

    const modifiedRes = await request.handleSubscriptions<CyHttpMessages.IncomingResponse>({
      eventName: RESPONSE_EVENT_NAMES,
      data: res,
      mergeChanges,
    })

    mergeChanges(request.res as any, modifiedRes)
  })
  .catch((err) => {
    debug('error emitting lazy response notifications %o', { err })
  })

  return request.continueResponse!(resStream)
}
