import { describe, expect, it } from 'vitest'
import { applyOutboundToProxiedRequest, proxyHttpCodec, toHttpRequest } from '../../../lib/adapters/proxy-http-interception'

function createCtx () {
  return {
    req: {
      browserPreRequest: {
        requestId: 'browser-req-1',
        headers: { 'accept-encoding': 'gzip, deflate' },
      },
      proxiedUrl: 'https://example.test/',
      method: 'GET',
      headers: { accept: 'text/html' },
      resourceType: 'document',
      isSyncRequest: false,
      responseTimeout: 30000,
      followRedirect: true,
    },
  } as any
}

describe('proxyHttpCodec', () => {
  it('decodes a proxy middleware context into a neutral HttpRequest', () => {
    const ctx = createCtx()
    const request = toHttpRequest(ctx)

    expect(request).to.include({
      browserRequestId: 'browser-req-1',
      url: 'https://example.test/',
      method: 'GET',
      resourceType: 'document',
      isSyncRequest: false,
      responseTimeout: 30000,
      followRedirect: true,
      browserAcceptEncoding: 'gzip, deflate',
    })

    expect(request.inFlightInterceptId).to.match(/^inFlightIntercept/)
    expect(request.headers).to.equal(ctx.req.headers)
  })

  it('prefers the proxy-captured original accept-encoding header', () => {
    const ctx = createCtx()

    ctx.req.originalAcceptEncoding = 'br'

    expect(toHttpRequest(ctx).browserAcceptEncoding).to.equal('br')
  })

  it('applies neutral request mutations back onto the proxied request', () => {
    const ctx = createCtx()

    applyOutboundToProxiedRequest(ctx.req, {
      inFlightInterceptId: 'in-flight-1',
      url: 'https://example.test/mutated',
      method: 'POST',
      headers: { 'x-mutated': '1' },
      body: 'request body',
      requestBodyMaterialized: true,
      responseTimeout: 1000,
      followRedirect: false,
    })

    expect(ctx.req).to.include({
      proxiedUrl: 'https://example.test/mutated',
      method: 'POST',
      body: 'request body',
      requestBodyMaterialized: true,
      responseTimeout: 1000,
      followRedirect: false,
    })

    expect(ctx.req.headers).to.deep.equal({ 'x-mutated': '1' })
  })

  it('exposes the proxy transport codec', () => {
    const ctx = createCtx()
    const request = proxyHttpCodec.decodeRequest(ctx)

    request.url = 'https://example.test/codec'
    proxyHttpCodec.applyRequest(ctx, request)

    expect(ctx.req.proxiedUrl).to.equal('https://example.test/codec')
  })
})
