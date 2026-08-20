import { Readable } from 'stream'
import zlib from 'zlib'
import type EventEmitter from 'events'
import { describe, expect, it } from 'vitest'
import { createSyntheticProxyCodec } from '../../../lib/adapters/synthetic-proxy-codec'
import { createSyntheticExpressContext, createSyntheticIncomingResponse } from '../../../lib/adapters/synthetic-express-context'
import RequestMiddleware from '../../../lib/http/request-middleware'
import { testMiddleware } from '../http/helpers'

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

  it('copies resourceType from the neutral request onto req', () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/',
      resourceType: 'xhr',
    })

    expect(req.resourceType).to.equal('xhr')
  })

  it('populates query like the Express-served MITM request', () => {
    // cy.intercept's request message picks query off req (SERIALIZABLE_REQ_PROPS);
    // without it the driver falsely flags requests as modified.
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/search?foo=bar&baz=two%20words',
    })

    expect(req.query).to.deep.equal({ foo: 'bar', baz: 'two words' })
  })

  it('leaves httpVersion unset rather than reporting a protocol it cannot know', () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/plain',
    })

    expect(req).not.to.have.property('httpVersion')
  })

  it('populates an empty query for urls without a search string', () => {
    const { req } = createSyntheticExpressContext({
      id: 'network-1',
      url: 'https://example.test/plain',
    })

    expect(req.query).to.deep.equal({})
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

  it('carries the reason phrase through to statusMessage', () => {
    const incomingRes = createSyntheticIncomingResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 404,
      statusMessage: 'Not Found',
    })

    expect(incomingRes.statusMessage).to.equal('Not Found')
  })

  // Node leaves statusMessage null on an unparsed IncomingMessage, which
  // breaks the non-optional string res.statusMessage is published as.
  it('keeps statusMessage a string when the response carries no reason phrase', () => {
    const incomingRes = createSyntheticIncomingResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 200,
    })

    expect(incomingRes.statusMessage).to.equal('')
  })

  it('does not fabricate an httpVersion on the synthetic response', () => {
    const incomingRes = createSyntheticIncomingResponse({
      id: 'network-1',
      url: 'https://example.test/',
      statusCode: 200,
    })

    expect(incomingRes.httpVersion).to.be.null
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

  it('decodes a pipeline re-encoded body back to identity and drops the encoding headers', async () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-3',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    // CompressBody re-encodes rewritten documents; the browser runs no
    // decoders on bodies handed back over this codec's transports
    ctx.res.status(200)
    ctx.res.set('content-type', 'text/html')
    ctx.res.set('content-encoding', 'gzip')
    ctx.res.set('content-length', '9999')
    ctx.res.end(zlib.gzipSync(Buffer.from('<html>compressed</html>')))

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('<html>compressed</html>')
    expect(response.headers).to.deep.equal({ 'content-type': 'text/html' })
  })

  it('decodes layered encodings outermost first', async () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-4',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    ctx.res.status(200)
    ctx.res.set('content-encoding', 'br, gzip')
    ctx.res.end(zlib.gzipSync(zlib.brotliCompressSync(Buffer.from('layered'))))

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('layered')
    expect(response.headers).to.deep.equal({})
  })

  it('decodes stub-declared x-gzip and deflate bodies', async () => {
    for (const [encoding, bytes] of [
      ['x-gzip', zlib.gzipSync(Buffer.from('aliased'))],
      ['deflate', zlib.deflateSync(Buffer.from('aliased'))],
    ] as const) {
      const codec = createSyntheticProxyCodec({
        createMiddlewareContext: (req, res) => {
          return {
            req,
            res,
          } as any
        },
      })

      const ctx = codec.encodeRequest({
        id: `network-${encoding}`,
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      const finished = onceFinish(ctx.res)

      ctx.res.status(200)
      ctx.res.set('content-encoding', encoding)
      ctx.res.end(bytes)

      await finished

      const response = codec.decodeResponse(ctx)

      expect(response.body?.toString(), encoding).to.equal('aliased')
      expect(response.headers, encoding).to.deep.equal({})
    }
  })

  it('drops a bare identity header without touching the body', async () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-identity',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    ctx.res.status(200)
    ctx.res.set('content-encoding', 'identity')
    ctx.res.end('plain')

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('plain')
    expect(response.headers).to.deep.equal({})
  })

  it('strips wire length headers from unencoded bodies', async () => {
    // the pipeline may have rewritten the body, so a captured content-length
    // no longer describes it
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-length',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    ctx.res.status(200)
    ctx.res.set('content-type', 'text/html')
    ctx.res.set('content-length', '9999')
    ctx.res.end('rewritten')

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('rewritten')
    expect(response.headers).to.deep.equal({ 'content-type': 'text/html' })
  })

  it('keeps the pair when a known encoding fails to decode', async () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-corrupt',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    ctx.res.status(200)
    ctx.res.set('content-encoding', 'gzip')
    ctx.res.set('content-length', '12')
    ctx.res.end(Buffer.from('not-gzip-at-all'))

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('not-gzip-at-all')
    expect(response.headers).to.deep.equal({
      'content-encoding': 'gzip',
      'content-length': '12',
    })
  })

  it('keeps the body and header pair when an encoding cannot be decoded', async () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-5',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    const finished = onceFinish(ctx.res)

    ctx.res.status(200)
    ctx.res.set('content-encoding', 'zstd')
    ctx.res.end(Buffer.from('opaque-bytes'))

    await finished

    const response = codec.decodeResponse(ctx)

    expect(response.body?.toString()).to.equal('opaque-bytes')
    expect(response.headers).to.deep.equal({ 'content-encoding': 'zstd' })
  })

  it('strips accept-encoding from the outbound request so the browser keeps its own negotiation', () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-2',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    // StripUnsupportedAcceptEncoding synthesizes a narrowed header when the
    // pause carries none; it must never ride out on Fetch.continueRequest
    ctx.req.headers['accept-encoding'] = 'gzip,identity'

    const outbound = codec.decodeRequest(ctx)

    expect(outbound.headers).to.not.have.property('accept-encoding')
    // the middleware's own view stays intact
    expect(ctx.req.headers['accept-encoding']).to.equal('gzip,identity')
  })

  it('copies bodySkipped onto the ctx as resBodySkipped', () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-skipped',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    codec.encodeResponse({
      id: 'network-skipped',
      url: 'https://example.test/',
      statusCode: 200,
      bodySkipped: true,
      bodyStream: Readable.from(['']),
    })

    expect(ctx.resBodySkipped).to.equal(true)
  })

  it('leaves resBodySkipped unset when bodySkipped is absent', () => {
    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-not-skipped',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    })

    codec.encodeResponse({
      id: 'network-not-skipped',
      url: 'https://example.test/',
      statusCode: 200,
      bodyStream: Readable.from(['origin']),
    })

    expect(ctx.resBodySkipped).to.be.undefined
  })

  it('carries the extra-target marker so ExtractCypressMetadataHeaders can narrow middleware', async () => {
    const { ExtractCypressMetadataHeaders } = RequestMiddleware

    const codec = createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => {
        return {
          req,
          res,
          debug: () => {},
        } as any
      },
    })

    const ctx = codec.encodeRequest({
      id: 'network-extra',
      url: 'https://example.test/download-basic-auth.csv',
      method: 'GET',
      headers: {
        'x-cypress-is-from-extra-target': 'true',
        accept: '*/*',
      },
    })

    expect(ctx.req.headers['x-cypress-is-from-extra-target']).to.equal('true')
    expect(ctx.req.isFromExtraTarget).to.equal(false)

    let maybeSetBasicAuthHeadersRan = false
    let skippedMiddlewareRan = false

    await testMiddleware({
      ExtractCypressMetadataHeaders,
      MaybeSetBasicAuthHeaders () {
        maybeSetBasicAuthHeadersRan = true
        this.next()
      },
      MaybeSimulateSecHeaders () {
        skippedMiddlewareRan = true
        this.next()
      },
    }, ctx)

    expect(ctx.req.headers['x-cypress-is-from-extra-target']).to.be.undefined
    expect(ctx.req.isFromExtraTarget).to.equal(true)
    expect(maybeSetBasicAuthHeadersRan).to.equal(true)
    expect(skippedMiddlewareRan).to.equal(false)
  })

  describe('abortRequest', () => {
    function createCodec () {
      return createSyntheticProxyCodec({
        createMiddlewareContext: (req, res) => {
          return {
            req,
            res,
          } as any
        },
      })
    }

    it('destroys the exchange of an in-flight request', async () => {
      const codec = createCodec()
      const ctx = codec.encodeRequest({
        id: 'network-abort',
        url: 'https://example.test/1mb',
        method: 'GET',
        headers: {},
      })

      const closed = new Promise<void>((resolve) => ctx.res.once('close', () => resolve()))

      codec.abortRequest('network-abort')

      await closed

      expect(ctx.req.destroyed, 'req destroyed').to.equal(true)
      expect(ctx.res.destroyed, 'res destroyed').to.equal(true)
    })

    it('is a no-op for an unknown request id', () => {
      expect(() => createCodec().abortRequest('never-seen')).not.to.throw()
    })

    it('is a no-op once the request has been released', () => {
      const codec = createCodec()
      const ctx = codec.encodeRequest({
        id: 'network-released',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      codec.releaseRequest?.('network-released')
      codec.abortRequest('network-released')

      expect(ctx.res.destroyed).to.equal(false)
    })

    it('does not re-destroy an exchange that is already aborted', () => {
      const codec = createCodec()
      const ctx = codec.encodeRequest({
        id: 'network-twice',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      let closeCount = 0

      ctx.res.on('close', () => closeCount++)

      codec.abortRequest('network-twice')
      codec.abortRequest('network-twice')

      return new Promise<void>((resolve) => setTimeout(resolve, 10)).then(() => {
        expect(closeCount).to.equal(1)
      })
    })
  })
})
