import _ from 'lodash'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import type { HttpResponse } from '@packages/network-interception'
import { getBodyStream, parseContentType } from '@packages/net-stubbing/lib/server/util'
import { caseInsensitiveGet } from '@packages/net-stubbing/lib/util'
import type { Readable } from 'stream'

type ProxyResponsePair = {
  incomingRes: IncomingMessage
  bodyStream: Readable
}

export const HttpResponseCodec = {
  /**
   * Wrap a live origin response in an {@link HttpResponse}. The `stream()` closure checks
   * `this.body` at call time — if a handler replaced the body, the replacement is streamed;
   * otherwise the origin stream is returned as-is.
   */
  fromOrigin (
    incomingRes: IncomingMessage,
    incomingResStream: Readable,
  ): HttpResponse {
    return {
      statusCode: incomingRes.statusCode || 200,
      statusMessage: incomingRes.statusMessage,
      headers: incomingRes.headers as Record<string, string | string[]>,
      stream () {
        if (this.body !== undefined) {
          return getBodyStream(this.body, { delay: this.delay, throttleKbps: this.throttleKbps })
        }

        return Promise.resolve(incomingResStream)
      },
    }
  },

  async toProxyResponse (response: HttpResponse): Promise<ProxyResponsePair> {
    const timing = _.pick(response, ['throttleKbps', 'delay'])
    const headers = { ...response.headers }

    if (!caseInsensitiveGet(headers, 'content-type') && typeof response.body === 'string') {
      const contentType = parseContentType(response.body)

      if (contentType) {
        headers['content-type'] = contentType
      }
    }

    const incomingRes = new IncomingMessage(new Socket)

    _.merge(incomingRes, {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers,
    })

    const bodyStream = response.stream
      ? await response.stream()
      : await getBodyStream(response.body, timing)

    return { incomingRes, bodyStream }
  },
}
