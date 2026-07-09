import { Readable } from 'stream'
import type EventEmitter from 'events'
import { describe, expect, it } from 'vitest'
import { createSyntheticHttpCodec } from '../../../lib/adapters/synthetic-http-codec'
import { createSyntheticExpressContext } from '../../../lib/adapters/synthetic-express-context'

async function readStream (stream: Readable): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString()
}

function onceFinish (res: EventEmitter): Promise<void> {
  return new Promise((resolve) => {
    res.once('finish', () => resolve())
  })
}

describe('createSyntheticExpressContext', () => {
  it('creates a readable request with method, headers, cookies, url, and body', async () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/form',
      method: 'POST',
      headers: {
        cookie: 'a=1; b=two%20words',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'name=value',
    })

    expect(req.method).to.equal('POST')
    expect(req.proxiedUrl).to.equal('https://example.test/form')
    expect(req.headers['content-type']).to.equal('application/x-www-form-urlencoded')
    expect(req.cookies).to.deep.equal({ a: '1', b: 'two words' })
    expect(await readStream(req)).to.equal('name=value')
  })

  it('captures response status, headers, and body', async () => {
    const { res } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
    })
    const finished = onceFinish(res)

    res.status(201)
    res.set('content-type', 'text/plain')
    res.end('created')

    await finished

    expect(res.getCapturedStatusCode()).to.equal(201)
    expect(res.getCapturedHeaders()).to.deep.equal({
      'content-type': 'text/plain',
    })

    expect(res.getCapturedBody().toString()).to.equal('created')
  })
})

describe('createSyntheticHttpCodec', () => {
  it('round-trips neutral request and response shapes through a synthetic proxy ctx', async () => {
    const codec = createSyntheticHttpCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-1',
      url: 'https://example.test/',
      method: 'GET',
      headers: {
        cookie: 'a=1',
      },
    })

    expect(ctx.id).to.equal('network-1')
    expect(ctx.req.cookies).to.deep.equal({ a: '1' })
    expect(codec.decodeRequest(ctx)).to.deep.include({
      id: 'network-1',
      method: 'GET',
      url: 'https://example.test/',
    })

    codec.encodeResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 202,
      headers: {
        'content-type': 'text/plain',
      },
      bodyStream: Readable.from(['origin']),
    })

    expect(ctx.incomingRes.statusCode).to.equal(202)
    expect(ctx.incomingRes.headers['content-type']).to.equal('text/plain')
    expect(await readStream(ctx.incomingResStream)).to.equal('origin')

    const finished = onceFinish(ctx.res)

    ctx.res.status(203)
    ctx.res.set('x-result', 'synthetic')
    ctx.res.end('final')

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.statusCode).to.equal(203)
    expect(response.headers).to.deep.equal({ 'x-result': 'synthetic' })
    expect(response.body?.toString()).to.equal('final')
  })
})
