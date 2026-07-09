import { describe, expect, it, vi } from 'vitest'
import { HttpIntercept } from '../../lib/core/http-intercept'
import type { TransportCodecPort } from '../../lib/ports/http-interception'

type TransportRequest = {
  id: string
  href: string
}

type TransportResponse = {
  id: string
  href: string
}

function createCodec (): TransportCodecPort<TransportRequest, TransportResponse> {
  const inFlightRequests = new Map<string, TransportRequest>()
  const inFlightResponses = new Map<string, TransportResponse>()

  return {
    decodeRequest (transportRequest) {
      inFlightRequests.set(transportRequest.id, transportRequest)

      return {
        id: transportRequest.id,
        url: transportRequest.href,
      }
    },

    encodeRequest (request) {
      const transportRequest = inFlightRequests.get(request.id)!

      transportRequest.href = request.url

      return transportRequest
    },

    getRequest (id) {
      return inFlightRequests.get(id)!
    },

    decodeResponse (response) {
      inFlightResponses.set(response.id, response)

      return {
        id: response.id,
        url: response.href,
      }
    },

    encodeResponse (response) {
      const transportResponse = inFlightResponses.get(response.id)!

      transportResponse.href = response.url
      inFlightRequests.delete(response.id)
      inFlightResponses.delete(response.id)

      return transportResponse
    },

    releaseRequest (id) {
      inFlightRequests.delete(id)
      inFlightResponses.delete(id)
    },
  }
}

describe('HttpIntercept', () => {
  it('passes through the transport request and response when no middleware is registered', async () => {
    const http = new HttpIntercept(createCodec())
    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    const next = vi.fn(async (nextRequest: TransportRequest): Promise<TransportResponse> => {
      return {
        id: nextRequest.id,
        href: nextRequest.href,
      }
    })

    const response = await http.handle(request, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(request)
    expect(response).to.deep.equal({
      id: 'req-1',
      href: 'https://example.test/',
    })
  })

  it('composes middleware in registration order around the origin forwarder', async () => {
    const http = new HttpIntercept(createCodec())
    const calls: string[] = []

    http.use(async (request, next) => {
      calls.push('first:request')
      request.url = 'https://example.test/first'

      const response = await next(request)

      calls.push('first:response')
      response.url = `${response.url}/first-response`

      return response
    })

    http.use(async (request, next) => {
      calls.push('second:request')
      request.url = 'https://example.test/second'

      const response = await next(request)

      calls.push('second:response')
      response.url = `${response.url}/second-response`

      return response
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    const response = await http.handle(request, async (nextRequest) => {
      calls.push('origin')

      return {
        id: nextRequest.id,
        href: nextRequest.href,
      }
    })

    expect(calls).to.deep.equal([
      'first:request',
      'second:request',
      'origin',
      'second:response',
      'first:response',
    ])

    expect(request.href).to.equal('https://example.test/second')
    expect(response.href).to.equal('https://example.test/second/second-response/first-response')
  })

  it('round-trips request and response mutations through the codec', async () => {
    const http = new HttpIntercept(createCodec())

    http.use(async (request, next) => {
      request.url = 'https://example.test/mutated'

      const response = await next(request)

      response.url = 'https://example.test/mutated-response'

      return response
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    const response = await http.handle(request, async (nextRequest) => {
      return {
        id: nextRequest.id,
        href: nextRequest.href,
      }
    })

    expect(request).to.deep.equal({
      id: 'req-1',
      href: 'https://example.test/mutated',
    })

    expect(response).to.deep.equal({
      id: 'req-1',
      href: 'https://example.test/mutated-response',
    })
  })

  it('passes the terminal forwarder to middleware so it can skip later layers', async () => {
    const http = new HttpIntercept(createCodec())
    const calls: string[] = []

    http.use(async (request, _next, terminal) => {
      calls.push('first')
      request.url = 'https://example.test/terminal'

      return terminal(request)
    })

    http.use(async (request, next) => {
      calls.push('second')

      return next(request)
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    const response = await http.handle(request, async (nextRequest) => {
      calls.push('origin')

      return {
        id: nextRequest.id,
        href: nextRequest.href,
      }
    })

    expect(calls).to.deep.equal([
      'first',
      'origin',
    ])

    expect(response.href).to.equal('https://example.test/terminal')
  })

  it('passes the transport returned from encodeRequest to next()', async () => {
    const encodedTransport: TransportRequest = {
      id: 'encoded-req',
      href: 'https://example.test/encoded',
    }

    const http = new HttpIntercept({
      ...createCodec(),
      encodeRequest (): TransportRequest {
        return encodedTransport
      },
    })

    http.use(async (request, next) => {
      request.url = 'https://example.test/encoded'

      return next(request)
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    const next = vi.fn(async (nextRequest: TransportRequest): Promise<TransportResponse> => {
      return {
        id: nextRequest.id,
        href: nextRequest.href,
      }
    })

    await http.handle(request, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(encodedTransport)
    expect(next).not.toHaveBeenCalledWith(request)
  })

  it('releases the in-flight request when handle rejects', async () => {
    const releaseRequest = vi.fn()
    const http = new HttpIntercept({
      ...createCodec(),
      releaseRequest,
    })

    const request: TransportRequest = {
      id: 'req-1',
      href: 'https://example.test/',
    }

    await expect(http.handle(request, async () => {
      throw new Error('origin failed')
    })).rejects.toThrow('origin failed')

    expect(releaseRequest).toHaveBeenCalledOnce()
    expect(releaseRequest).toHaveBeenCalledWith('req-1')
  })
})
