import { Readable } from 'stream'
import type EventEmitter from 'events'
import { describe, expect, it } from 'vitest'
import { createSyntheticProxyCodec } from '../../../lib/adapters/synthetic-proxy-codec'
import { createSyntheticExpressContext, createSyntheticIncomingResponse } from '../../../lib/adapters/synthetic-express-context'

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

  it('lowercases request header keys like Node IncomingMessage', () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
      headers: {
        Cookie: 'session=abc',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip',
      },
    })

    expect(req.headers).to.deep.equal({
      cookie: 'session=abc',
      'sec-fetch-dest': 'document',
      'accept-encoding': 'gzip',
    })

    expect(req.cookies).to.deep.equal({ session: 'abc' })
  })

  it('lowercases synthetic response header keys like Node IncomingMessage', () => {
    const incomingRes = createSyntheticIncomingResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 200,
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'text/html',
        'Set-Cookie': 'a=1',
      },
    })

    expect(incomingRes.headers).to.deep.equal({
      'content-encoding': 'gzip',
      'content-type': 'text/html',
      'set-cookie': 'a=1',
    })
  })

  it('merges multi-value headers that differ only by case when lowercasing', () => {
    const incomingRes = createSyntheticIncomingResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 200,
      headers: {
        'Set-Cookie': 'a=1',
        'set-cookie': 'b=2',
      },
    })

    expect(incomingRes.headers['set-cookie']).to.deep.equal(['a=1', 'b=2'])
  })

  it('keeps malformed cookie values without throwing', () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/form',
      headers: {
        cookie: 'valid=1; malformed=%',
      },
    })

    expect(req.cookies).to.deep.equal({ valid: '1', malformed: '%' })
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

  it('leaves the injection level undecided so SetInjectionLevel determines it', () => {
    const { res } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
    })

    expect(res.wantsInjection).to.be.null
    expect(res.wantsSecurityRemoved).to.be.null
  })

  it('exposes a Node-compatible kOutHeaders symbol for header patching', () => {
    const { res } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
    })

    const kOutHeaders = Object.getOwnPropertySymbols(res).find((sym) => {
      return sym.toString() === 'Symbol(kOutHeaders)'
    })

    expect(kOutHeaders).to.exist
  })

  it('serializes cookies with Express-compatible Path and attributes', () => {
    const { res } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
    })

    res.cookie('session', 'abc', {
      domain: 'example.test',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 900000,
    })

    const setCookie = res.getHeader('Set-Cookie') as string

    expect(setCookie).to.include('session=abc')
    expect(setCookie).to.include('Path=/')
    expect(setCookie).to.include('Domain=example.test')
    expect(setCookie).to.include('Max-Age=900')
    expect(setCookie).to.include('HttpOnly')
    expect(setCookie).to.include('Secure')
    expect(setCookie).to.include('SameSite=lax')
    expect(setCookie).to.match(/Expires=/)
  })

  it('serializes boolean SameSite as Strict', () => {
    const { res } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
    })

    res.cookie('session', 'abc', {
      sameSite: true,
    })

    expect(res.getHeader('Set-Cookie')).to.equal('session=abc; Path=/; SameSite=Strict')
  })
})

describe('createSyntheticProxyCodec', () => {
  it('round-trips neutral request and response shapes through a synthetic proxy ctx', async () => {
    const codec = createSyntheticProxyCodec({
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
