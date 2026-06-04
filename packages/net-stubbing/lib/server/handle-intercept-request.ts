import _ from 'lodash'
import url from 'url'
import { concatStream } from '@packages/network'
import type { RequestMiddleware } from '@packages/proxy'
import type { NetworkInterceptionCore } from '@packages/network-interception'
import {
  CyHttpMessages,
  SERIALIZABLE_REQ_PROPS,
} from '../types'
import {
  setDefaultHeaders,
  getBodyEncoding,
} from './util'
import { InterceptedRequest } from './intercepted-request'
import { telemetry } from '@packages/telemetry'

type InterceptRequestMiddleware = RequestMiddleware extends (this: infer T) => any ? T : never

/**
 * Legacy intercept-request orchestration — invoked via {@link NetworkInterceptionCore.handleRequest}.
 */
export async function handleInterceptRequest (
  mw: InterceptRequestMiddleware,
  core: NetworkInterceptionCore,
): Promise<void> {
  const span = telemetry.startSpan({ name: 'intercept:request', parentSpan: mw.reqMiddlewareSpan, isVerbose: true })

  if (!mw.req.matchingRoutes?.length) {
    span?.end()

    return mw.next()
  }

  const request = new InterceptedRequest({
    continueRequest: mw.next,
    onError: mw.onError,
    onResponse: (incomingRes, resStream) => {
      setDefaultHeaders(mw.req, incomingRes)
      mw.onResponse(incomingRes, resStream)
    },
    req: mw.req,
    res: mw.res,
    socket: mw.socket,
    state: mw.netStubbingState,
  })

  mw.debug('cy.intercept: intercepting request')

  mw.req.requestId = request.id

  mw.netStubbingState.requests[request.id] = request

  const req = _.extend(_.pick(request.req, SERIALIZABLE_REQ_PROPS), {
    url: request.req.proxiedUrl,
  }) as CyHttpMessages.IncomingRequest

  request.res.once('finish', async () => {
    await request.handleSubscriptions<CyHttpMessages.ResponseComplete>({
      eventName: 'after:response',
      data: request.includeBodyInAfterResponse ? {
        finalResBody: request.res.body!,
      } : {},
      mergeChanges: _.noop,
    })

    mw.debug('cy.intercept: request/response finished, cleaning up')
    delete mw.netStubbingState.requests[request.id]
  })

  const ensureBody = () => {
    return new Promise<void>((resolve) => {
      if (req.body) {
        return resolve()
      }

      const onClose = (): void => {
        req.body = ''

        return resolve()
      }

      if (request.res.destroyed) {
        onClose()
      }

      request.res.once('close', onClose)

      request.req.pipe(concatStream((reqBody) => {
        req.body = reqBody
        request.res.off('close', onClose)
        resolve()
      }))
    })
  }

  await ensureBody()

  request.addDefaultSubscriptions()

  if (!_.isString(req.body) && !_.isBuffer(req.body)) {
    throw new Error('req.body must be a string or a Buffer')
  }

  const bodyEncoding = getBodyEncoding(req)
  const bodyIsBinary = bodyEncoding === 'binary'

  if (bodyIsBinary) {
    mw.debug('cy.intercept: req.body contained non-utf8 characters, treating as binary content')
  }

  if (!bodyIsBinary) {
    req.body = req.body.toString('utf8')
  }

  request.req.body = req.body

  const mergeChanges = (before: CyHttpMessages.IncomingRequest, after: CyHttpMessages.IncomingRequest) => {
    request.req.proxiedUrl = core.mergeIncomingRequestChanges(before, after, {
      baseUrl: request.req.proxiedUrl,
      resolveUrl: (baseUrl, relativeUrl) => url.resolve(baseUrl, relativeUrl),
    })
  }

  const modifiedReq = await request.handleSubscriptions<CyHttpMessages.IncomingRequest>({
    eventName: 'before:request',
    data: req,
    mergeChanges,
  })

  mergeChanges(req, modifiedReq)
  // @ts-expect-error request.req is the live proxied request object
  mergeChanges(request.req, req)

  if (request.responseSent) {
    span?.end()

    return mw.end()
  }

  span?.end()

  return request.continueRequest()
}
