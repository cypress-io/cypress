import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { proxyHttpCodec, resolveProxyResponseBodyStream } from '../../../lib/adapters/http-codec'

async function readStream (stream: Readable): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString()
}

function createCtx () {
  return {
    req: {
      proxiedUrl: 'https://example.test/',
      method: 'GET',
      headers: {},
    },
    res: {
      writeHead () {},
      end () {},
    },
  } as any
}

describe('proxyHttpCodec', () => {
  it('decodes a proxy middleware context into a neutral HttpRequest', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    expect(request.url).to.equal('https://example.test/')
    expect(request.method).to.equal('GET')
    expect(request.headers).to.deep.equal({})
    expect(request.id).to.be.a('string')
    expect(ctx.id).to.equal(request.id)
  })

  it('encodes neutral request mutations back onto the proxied request', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    request.url = 'https://example.test/mutated'
    proxyHttpCodec.encodeRequest(request)

    expect(ctx.req.proxiedUrl).to.equal('https://example.test/mutated')
  })

  it('recovers the in-flight proxy ctx by request id', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    expect(proxyHttpCodec.getRequest(request.id)).to.equal(ctx)
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

  it('writes fulfilled neutral responses directly to the browser response', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)
    const writes: any[] = []

    ctx.res.writeHead = (...args) => writes.push(['writeHead', ...args])
    ctx.res.end = (...args) => writes.push(['end', ...args])

    const encoded = proxyHttpCodec.encodeResponse({
      id: request.id,
      url: 'https://example.test/fulfilled',
      statusCode: 201,
      headers: {
        'content-type': 'text/plain',
        'x-empty': undefined,
      },
      body: 'created',
    })

    expect(encoded).to.equal(ctx)
    expect(writes).to.deep.equal([
      ['writeHead', 201, { 'content-type': 'text/plain' }],
      ['end', 'created'],
    ])
  })

  it('throws a descriptive error when middleware returns without forwarding', () => {
    expect(() => {
      proxyHttpCodec.encodeResponse({
        id: 'missing-request-id',
        url: 'https://example.test/',
      })
    }).to.throw('HttpIntercept middleware must call next() before returning a response')
  })

  it('materializes a stub body stream when committing to the proxy', async () => {
    const ctx = createCtx()

    ctx.httpInterceptStubBody = '<html><body>created</body></html>'

    expect(await readStream(await resolveProxyResponseBodyStream(ctx))).to.equal('<html><body>created</body></html>')
  })

  it('passes through the origin body stream when one is attached to the ctx', async () => {
    const ctx = createCtx()
    const bodyStream = Readable.from(['origin'])

    ctx.originBodyStream = bodyStream

    expect(await resolveProxyResponseBodyStream(ctx)).to.equal(bodyStream)
  })
})
