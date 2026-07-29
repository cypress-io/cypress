import { describe, expect, it, vi } from 'vitest'
import { Readable } from 'stream'
import { ProxyContentEncodingAdapter } from '../../../lib/adapters/content-encoding'

function requestCtx (headers: Record<string, any> = {}) {
  return {
    req: { headers: { ...headers } },
    debug: () => {},
    next: vi.fn(),
  }
}

function responseCtx (props: Record<string, any> = {}) {
  const { incomingResHeaders, ...rest } = props

  return {
    incomingRes: { headers: { ...incomingResHeaders } },
    incomingResStream: Readable.from(['body']),
    res: { removeHeader: vi.fn() },
    makeResStreamPlainText: vi.fn(),
    debug: () => {},
    onError: () => {},
    next: vi.fn(),
    ...rest,
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
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('synthesizes gzip,identity when the request carries no accept-encoding', () => {
      const ctx = requestCtx()

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toEqual('gzip,identity')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('re-encodes a decoded body in the original encoding order', async () => {
      const ctx = responseCtx({ contentEncodingOrder: ['gzip'], isGunzipped: true })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).not.toBe(original)
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('leaves a body the pipeline never decoded alone', async () => {
      const ctx = responseCtx({ contentEncodingOrder: ['gzip'], isGunzipped: false })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })
  })
})
