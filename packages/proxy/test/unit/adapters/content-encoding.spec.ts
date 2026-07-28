import { describe, expect, it } from 'vitest'
import { Readable } from 'stream'
import { NoopContentEncodingAdapter, ProxyContentEncodingAdapter } from '../../../lib/adapters/content-encoding'

function requestCtx (headers: Record<string, any> = {}) {
  return {
    req: { headers: { ...headers } },
    debug: () => {},
  }
}

function responseCtx (props: Record<string, any> = {}) {
  return {
    incomingResStream: Readable.from(['body']),
    debug: () => {},
    onError: () => {},
    ...props,
  }
}

describe('adapters/content-encoding', () => {
  describe('ProxyContentEncodingAdapter', () => {
    const adapter = new ProxyContentEncodingAdapter()

    it('narrows accept-encoding to what Node can decode', () => {
      const ctx = requestCtx({ 'accept-encoding': 'gzip, deflate, br' })

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toEqual('gzip,br')
      expect((ctx.req as any).originalAcceptEncoding).toEqual('gzip, deflate, br')
    })

    it('synthesizes gzip,identity when the request carries no accept-encoding', () => {
      const ctx = requestCtx()

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toEqual('gzip,identity')
    })

    it('re-encodes a decoded body in the original encoding order', async () => {
      const ctx = responseCtx({ contentEncodingOrder: ['gzip'], isGunzipped: true })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).not.toEqual(original)
    })
  })

  describe('NoopContentEncodingAdapter', () => {
    const adapter = new NoopContentEncodingAdapter()

    it('leaves accept-encoding untouched so the browser keeps its own negotiation', () => {
      const ctx = requestCtx()

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toBeUndefined()
    })

    it('does not synthesize accept-encoding over a header the browser already set', () => {
      const ctx = requestCtx({ 'accept-encoding': 'gzip, deflate, br, zstd' })

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toEqual('gzip, deflate, br, zstd')
    })

    it('leaves the response stream unencoded so fulfillRequest gets identity', async () => {
      const ctx = responseCtx({ contentEncodingOrder: ['gzip'], isGunzipped: true })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toEqual(original)
    })
  })
})
