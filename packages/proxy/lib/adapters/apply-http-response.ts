import _ from 'lodash'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import type { HttpResponse } from '@packages/network-interception'
import { getBodyStream, parseContentType, setDefaultHeaders } from '@packages/net-stubbing/lib/server/util'
import { caseInsensitiveGet } from '@packages/net-stubbing/lib/util'
import type { RequestInterceptionMiddlewareCtx } from './types'

function getFakeClientResponse (opts: {
  statusCode: number
  headers: Record<string, string | string[]>
  body?: string | Buffer
  statusMessage?: string
}) {
  const headers = { ...opts.headers }

  if (!caseInsensitiveGet(headers, 'content-type') && typeof opts.body === 'string') {
    const contentType = parseContentType(opts.body)

    if (contentType) {
      headers['content-type'] = contentType
    }
  }

  const clientResponse = new IncomingMessage(new Socket)

  _.merge(clientResponse, {
    statusCode: opts.statusCode,
    statusMessage: opts.statusMessage,
    headers,
  })

  return clientResponse
}

/**
 * Convert an intercept response into proxy ctx and end the request stage.
 */
export async function applyHttpResponseToCtx (
  mw: RequestInterceptionMiddlewareCtx,
  response: HttpResponse,
): Promise<void> {
  mw.req.requestId = mw.req.requestId || _.uniqueId('interceptedRequest')
  mw.req.onInterceptResponseWritten = response.onResponseWrittenToClient

  if (response.body === undefined && response.consumePassthroughResponse) {
    const { incomingRes, stream } = response.consumePassthroughResponse()

    incomingRes.statusCode = response.statusCode ?? incomingRes.statusCode ?? 200

    if (response.statusMessage !== undefined) {
      incomingRes.statusMessage = response.statusMessage
    }

    incomingRes.headers = {
      ...(incomingRes.headers as Record<string, string | string[]>),
      ...response.headers,
    }

    if (mw.req.hadIntercept) {
      setDefaultHeaders(mw.req, incomingRes)
    }

    const bodyStream = await getBodyStream(stream, _.pick(response, ['throttleKbps', 'delay']) as any)

    mw.onResponse(incomingRes, bodyStream)

    return
  }

  const incomingRes = getFakeClientResponse({
    statusCode: response.statusCode,
    statusMessage: response.statusMessage,
    headers: response.headers,
    body: response.body ?? '',
  })

  if (mw.req.hadIntercept) {
    setDefaultHeaders(mw.req, incomingRes)
  }

  const bodyStream = await getBodyStream(response.body, _.pick(response, ['throttleKbps', 'delay']) as any)

  mw.onResponse(incomingRes, bodyStream)
}
