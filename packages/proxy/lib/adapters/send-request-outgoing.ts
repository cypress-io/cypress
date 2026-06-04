import _ from 'lodash'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Send the proxied request to the origin via Node HTTP.
 *
 * HTTP/2 bypass boundary: the browser-automation path must not call this —
 * requests terminate at CDP Fetch instead of MITM proxy forwarding.
 */
export function sendRequestOutgoing (mw: RequestInterceptionMiddlewareCtx): void {
  mw.reqMiddlewareSpan?.end()

  const span = telemetry.startSpan({
    name: 'outgoing:request:ttfb',
    parentSpan: mw.handleHttpRequestSpan,
    isVerbose,
  })

  const requestOptions = {
    browserPreRequest: mw.req.browserPreRequest,
    timeout: mw.req.responseTimeout,
    strictSSL: false,
    followRedirect: mw.req.followRedirect || false,
    retryIntervals: [],
    url: mw.req.proxiedUrl,
    time: !!span,
  }

  const requestBodyBuffered = !!mw.req.body

  const { strategy, origin, fileServer } = mw.remoteStates.current()

  span?.setAttributes({
    requestBodyBuffered,
    strategy,
  })

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    mw.req.headers['x-cypress-authorization'] = mw.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer as string)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(mw.req, 'method', 'body', 'headers'))
  }

  const req = mw.request.create(requestOptions)
  const socket = mw.req.socket

  const onSocketClose = () => {
    mw.debug('request aborted')

    const pendingRequest = mw.pendingRequest

    if (pendingRequest) {
      delete mw.pendingRequest
      mw.removePendingRequest(pendingRequest)
    }

    mw.reqMiddlewareSpan?.setAttributes({
      requestAborted: true,
    })

    mw.reqMiddlewareSpan?.end()
    mw.handleHttpRequestSpan?.end()

    req.abort()
  }

  req.on('error', mw.onError)
  req.on('response', (incomingRes) => {
    if (span) {
      const { timings } = incomingRes.request

      if (!timings.socket) {
        timings.socket = 0
      }

      if (!timings.lookup) {
        timings.lookup = timings.socket
      }

      if (!timings.connect) {
        timings.connect = timings.lookup
      }

      if (!timings.response) {
        timings.response = timings.connect
      }

      span.setAttributes({
        'request.timing.socket': timings.socket,
        'request.timing.dns': timings.lookup - timings.socket,
        'request.timing.tcp': timings.connect - timings.lookup,
        'request.timing.firstByte': timings.response - timings.connect,
        'request.timing.totalUntilFirstByte': timings.response,
      })

      span.end()
    }

    mw.onResponse(incomingRes, req)
  })

  mw.req.res?.on('finish', () => {
    socket.removeListener('close', onSocketClose)
  })

  mw.req.socket.on('close', onSocketClose)

  if (!requestBodyBuffered) {
    mw.req.pipe(req)
  }

  mw.outgoingReq = req
}
