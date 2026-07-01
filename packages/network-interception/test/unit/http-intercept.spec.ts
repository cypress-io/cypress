import { describe, expect, it, vi } from 'vitest'
import { HttpIntercept } from '../../lib/core/http-intercept'
import type { HttpRequest, HttpResponse, HttpTransportCodec } from '../../lib/ports/http-interception'

type TransportRequest = {
  id: string
  href: string
  method: string
  headers: Record<string, string | string[]>
  body?: string | Buffer
}

type TransportResponse = {
  code: number
  headers: Record<string, string | string[]>
  body?: string | Buffer
}

function createCodec (): HttpTransportCodec<TransportRequest, TransportResponse> {
  return {
    decodeRequest (request): HttpRequest {
      return {
        inFlightInterceptId: request.id,
        url: request.href,
        method: request.method,
        headers: request.headers,
        body: request.body,
      }
    },

    applyRequest (transportRequest, request): void {
      transportRequest.href = request.url
      transportRequest.method = request.method
      transportRequest.headers = request.headers
      transportRequest.body = request.body
    },

    decodeResponse (response): HttpResponse {
      return {
        statusCode: response.code,
        headers: response.headers,
        body: response.body,
      }
    },

    encodeResponse (response): TransportResponse {
      return {
        code: response.statusCode,
        headers: response.headers,
        body: response.body,
      }
    },
  }
}

describe('HttpIntercept', () => {
  it('passes through the transport request and response when no middleware is registered', async () => {
    const http = new HttpIntercept(createCodec())
    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
      method: 'GET',
      headers: {},
    }

    const next = vi.fn(async (nextRequest: TransportRequest): Promise<TransportResponse> => {
      return {
        code: 204,
        headers: { 'x-url': nextRequest.href },
      }
    })

    const response = await http.handle(request, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(request)
    expect(response).to.deep.equal({
      code: 204,
      headers: { 'x-url': 'https://example.test/' },
      body: undefined,
    })
  })

  it('composes middleware in registration order around the origin forwarder', async () => {
    const http = new HttpIntercept(createCodec())
    const calls: string[] = []

    http.use(async (request, next) => {
      calls.push('first:request')
      request.headers['x-first'] = '1'

      const response = await next(request)

      calls.push('first:response')
      response.headers['x-first-response'] = '1'

      return response
    })

    http.use(async (request, next) => {
      calls.push('second:request')
      request.headers['x-second'] = '1'

      const response = await next(request)

      calls.push('second:response')
      response.headers['x-second-response'] = '1'

      return response
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
      method: 'GET',
      headers: {},
    }

    const response = await http.handle(request, async (nextRequest) => {
      calls.push('origin')

      return {
        code: 200,
        headers: {
          ...nextRequest.headers,
          'x-origin': '1',
        },
      }
    })

    expect(calls).to.deep.equal([
      'first:request',
      'second:request',
      'origin',
      'second:response',
      'first:response',
    ])

    expect(request.headers).to.deep.equal({
      'x-first': '1',
      'x-second': '1',
    })

    expect(response.headers).to.deep.equal({
      'x-first': '1',
      'x-second': '1',
      'x-origin': '1',
      'x-second-response': '1',
      'x-first-response': '1',
    })
  })

  it('round-trips request and response mutations through the codec', async () => {
    const http = new HttpIntercept(createCodec())

    http.use(async (request, next) => {
      request.url = 'https://example.test/mutated'
      request.method = 'POST'
      request.body = 'mutated request'

      const response = await next(request)

      response.statusCode = 201
      response.body = 'mutated response'

      return response
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
      method: 'GET',
      headers: {},
    }

    const response = await http.handle(request, async (nextRequest) => {
      return {
        code: nextRequest.method === 'POST' ? 200 : 500,
        headers: { location: nextRequest.href },
        body: nextRequest.body,
      }
    })

    expect(request).to.deep.equal({
      id: 'req-1',
      href: 'https://example.test/mutated',
      method: 'POST',
      headers: {},
      body: 'mutated request',
    })

    expect(response).to.deep.equal({
      code: 201,
      headers: { location: 'https://example.test/mutated' },
      body: 'mutated response',
    })
  })
})
