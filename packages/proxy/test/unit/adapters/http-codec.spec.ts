import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { createProxyHttpCodec, proxyHttpCodec } from '../../../lib/adapters/http-codec'

function createCtx () {
  return {
    req: {
      proxiedUrl: 'https://example.test/',
    },
  } as any
}

function createRecordingRes () {
  const res = {
    headersSent: false,
    writableFinished: false,
    statusCode: 200,
    statusMessage: '',
    headers: {} as Record<string, string | string[] | undefined>,
    body: undefined as string | Buffer | undefined,
  }

  return Object.assign(res, {
    status: (statusCode: number) => {
      res.statusCode = statusCode

      return res
    },
    set: (name: string, value: string | string[]) => {
      res.headers[name] = value

      return res
    },
    end: (body?: string | Buffer) => {
      res.body = body
      res.writableFinished = true

      return res
    },
  })
}

function createCtxWithRes () {
  const res = createRecordingRes()

  return { ctx: { ...createCtx(), res } as any, res }
}

describe('proxyHttpCodec', () => {
  it('decodes a proxy middleware context into a neutral HttpRequest', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    expect(request.url).to.equal('https://example.test/')
    expect(request.id).to.be.a('string')
    expect(ctx.id).to.equal(request.id)
  })

  it('copies resourceType from the middleware request onto the neutral request', () => {
    const ctx = createCtx()

    ctx.req.resourceType = 'xhr'

    expect(proxyHttpCodec.decodeRequest(ctx).resourceType).to.equal('xhr')
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

  describe('a response synthesized by a short-circuiting middleware (#34810)', () => {
    it('is written to the Express client response when the middleware answered without next()', () => {
      // The legacy pipeline never runs for a middleware that answers directly,
      // so nothing else writes ctx.res; without this the response is dropped
      // and the request hangs with no response.
      const { ctx, res } = createCtxWithRes()
      const request = proxyHttpCodec.decodeRequest(ctx)

      const encoded = proxyHttpCodec.encodeResponse({
        id: request.id,
        url: 'http://localhost:1234/__/does-not-exist',
        statusCode: 404,
        headers: { 'content-type': 'text/plain' },
        body: 'Not Found',
      })

      expect(encoded).to.equal(ctx)
      expect(res.statusCode).to.equal(404)
      expect(res.headers).to.deep.equal({ 'content-type': 'text/plain' })
      expect(res.body).to.equal('Not Found')
      expect(res.writableFinished).to.be.true
    })

    it('is not written for a response that came through the origin fetch', () => {
      // The pipeline owns writing ctx.res for origin responses; encoding must
      // leave it alone to avoid a double write.
      const { ctx, res } = createCtxWithRes()
      const incomingRes = new IncomingMessage(new Socket)

      proxyHttpCodec.decodeRequest(ctx)

      incomingRes.statusCode = 200
      ctx.incomingRes = incomingRes
      ctx.incomingResStream = Readable.from(['body'])

      proxyHttpCodec.encodeResponse(proxyHttpCodec.decodeResponse(ctx))

      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.deep.equal({})
      expect(res.body).to.be.undefined
      expect(res.writableFinished).to.be.false
    })

    it('is not written when the pipeline already wrote the client response', () => {
      const { ctx, res } = createCtxWithRes()

      res.headersSent = true
      const request = proxyHttpCodec.decodeRequest(ctx)

      proxyHttpCodec.encodeResponse({
        id: request.id,
        url: 'http://localhost:1234/__/does-not-exist',
        statusCode: 404,
        body: 'Not Found',
      })

      expect(res.statusCode).to.equal(200)
      expect(res.body).to.be.undefined
    })

    it('is not written by a codec that does not opt into synthesized writes', () => {
      // The synthetic (CDP) codec primes its ctx from the origin response and
      // lets the pipeline write the client response itself.
      const { ctx, res } = createCtxWithRes()
      const codec = createProxyHttpCodec()
      const request = codec.decodeRequest(ctx)

      codec.encodeResponse({
        id: request.id,
        url: 'http://localhost:1234/__/does-not-exist',
        statusCode: 404,
        body: 'Not Found',
      })

      expect(res.statusCode).to.equal(200)
      expect(res.body).to.be.undefined
      expect(res.writableFinished).to.be.false
    })
  })
})
