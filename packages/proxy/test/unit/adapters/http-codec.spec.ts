import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { proxyHttpCodec } from '../../../lib/adapters/http-codec'

function createCtx () {
  return {
    req: {
      proxiedUrl: 'https://example.test/',
    },
  } as any
}

describe('proxyHttpCodec', () => {
  it('decodes a proxy middleware context into a neutral HttpRequest', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    expect(request.url).to.equal('https://example.test/')
    expect(request.id).to.be.a('string')
    expect(ctx.id).to.equal(request.id)
  })

  it('encodes neutral request mutations back onto the proxied request', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    request.url = 'https://example.test/mutated'
    request.method = 'POST'
    request.headers = {
      'accept-encoding': 'gzip, deflate',
      authorization: 'Basic abc123',
    }

    request.body = 'payload'

    proxyHttpCodec.encodeRequest(request)

    expect(ctx.req.proxiedUrl).to.equal('https://example.test/mutated')
    expect(ctx.req.method).to.equal('POST')
    expect(ctx.req.headers).to.deep.equal({
      'accept-encoding': 'gzip, deflate',
      authorization: 'Basic abc123',
    })

    expect(ctx.req.body).to.equal('payload')
  })

  it('round-trips request mutations through decode and encode', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    request.url = 'https://example.test/codec'
    proxyHttpCodec.encodeRequest(request)

    expect(ctx.req.proxiedUrl).to.equal('https://example.test/codec')
  })

  it('decodes an origin response ctx into a neutral HttpResponse', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)
    const incomingRes = new IncomingMessage(new Socket)

    incomingRes.statusCode = 204
    ctx.httpInterceptIncomingRes = incomingRes
    ctx.originBodyStream = Readable.from(['origin'])

    const response = proxyHttpCodec.decodeResponse(ctx)

    expect(response.id).to.equal(request.id)
    expect(response.url).to.equal('https://example.test/')
    expect(response.bodyStream).to.equal(ctx.originBodyStream)
    expect(response.statusCode).to.equal(204)
  })

  it('returns the same ctx from encodeResponse', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    proxyHttpCodec.encodeRequest(request)

    const encoded = proxyHttpCodec.encodeResponse({
      id: request.id,
      url: 'https://example.test/encoded',
    })

    expect(encoded).to.equal(ctx)
    expect(ctx.req.proxiedUrl).to.equal('https://example.test/encoded')
  })

  it('throws a descriptive error when middleware returns without forwarding', () => {
    expect(() => {
      proxyHttpCodec.encodeResponse({
        id: 'missing-request-id',
        url: 'https://example.test/',
      })
    }).to.throw('HttpIntercept middleware must call next() before returning a response')
  })

  it('can encodeResponse after releaseRequest using the decoded response ctx', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)
    const incomingRes = new IncomingMessage(new Socket)

    incomingRes.statusCode = 200
    ctx.incomingRes = incomingRes
    ctx.incomingResStream = Readable.from(['body'])

    const response = proxyHttpCodec.decodeResponse(ctx)

    proxyHttpCodec.releaseRequest?.(request.id)

    const encoded = proxyHttpCodec.encodeResponse({
      ...response,
      url: 'https://example.test/after-release',
    })

    expect(encoded).to.equal(ctx)
    expect(ctx.req.proxiedUrl).to.equal('https://example.test/after-release')
  })
})
