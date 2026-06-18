import _ from 'lodash'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import type { HttpResponse } from '@packages/network-interception'
import { getBodyStream, setDefaultHeaders } from '@packages/net-stubbing/lib/server/util'
import type { RequestInterceptionMiddlewareCtx } from './types'

function getFakeClientResponse (opts: {
  statusCode: number
  headers: Record<string, string | string[]>
  body: string | Buffer
  statusMessage?: string
}) {
  const clientResponse = new IncomingMessage(new Socket)

  _.merge(clientResponse, {
    statusCode: opts.statusCode,
    statusMessage: opts.statusMessage,
    headers: opts.headers,
  })

  return clientResponse
}

/**
 * Convert a materialized intercept response into proxy ctx and end the request stage.
 */
export async function applyHttpResponseToCtx (
  mw: RequestInterceptionMiddlewareCtx,
  response: HttpResponse,
): Promise<void> {
  mw.req.requestId = mw.req.requestId || _.uniqueId('interceptedRequest')

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
