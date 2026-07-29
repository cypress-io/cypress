import { describe, expect, it, vi } from 'vitest'
import zlib from 'zlib'
import { Readable } from 'stream'
import { IdentityContentEncodingAdapter } from '../../../lib/adapters/identity-content-encoding'

function requestCtx (headers: Record<string, any> = {}) {
  return {
    req: { headers: { ...headers } },
    next: vi.fn(),
  }
}

function responseCtx (incomingResHeaders: Record<string, any> = {}, body: Buffer | string = 'body', flags: Record<string, boolean> = {}) {
  return {
    incomingRes: { headers: { ...incomingResHeaders } },
    incomingResStream: Readable.from([body]),
    res: { removeHeader: vi.fn(), setHeader: vi.fn() },
    onError: (err: Error) => {
      throw err
    },
    next: vi.fn(),
    ...flags,
  }
}

async function readStream (stream: Readable): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString()
}

describe('adapters/identity-content-encoding', () => {
  const adapter = new IdentityContentEncodingAdapter()

  describe('constrainAcceptEncoding', () => {
    it('leaves accept-encoding untouched so the browser keeps its own negotiation', () => {
      const ctx = requestCtx()

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toBeUndefined()
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('does not narrow an accept-encoding header the browser already set', () => {
      const ctx = requestCtx({ 'accept-encoding': 'gzip, deflate, br, zstd' })

      adapter.constrainAcceptEncoding(ctx)

      expect(ctx.req.headers['accept-encoding']).toEqual('gzip, deflate, br, zstd')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })
  })

  describe('compressBody', () => {
    it('leaves the stream and headers alone when no encoding survived the transport', async () => {
      const ctx = responseCtx()
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.res.removeHeader).not.toHaveBeenCalled()
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('drops a bare identity header without touching the body', async () => {
      const ctx = responseCtx({ 'content-encoding': 'identity' })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('decodes a stub-declared gzip body', async () => {
      const ctx = responseCtx({ 'content-encoding': 'gzip' }, zlib.gzipSync(Buffer.from('plain')))

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('decodes a stub-declared x-gzip body', async () => {
      const ctx = responseCtx({ 'content-encoding': 'x-gzip' }, zlib.gzipSync(Buffer.from('plain')))

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('decodes a stub-declared deflate body', async () => {
      const ctx = responseCtx({ 'content-encoding': 'deflate' }, zlib.deflateSync(Buffer.from('plain')))

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('decodes a layered stub-declared encoding outermost first', async () => {
      const layered = zlib.gzipSync(zlib.brotliCompressSync(Buffer.from('plain')))
      const ctx = responseCtx({ 'content-encoding': 'br, gzip' }, layered)

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('decodes every layer of a repeated encoding', async () => {
      const doubled = zlib.gzipSync(zlib.gzipSync(Buffer.from('plain')))
      const ctx = responseCtx({ 'content-encoding': 'gzip, gzip' }, doubled)

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('skips a gzip layer earlier middleware already decoded', async () => {
      // makeResStreamPlainText decoded the outer layer and set isGunzipped;
      // only the inner layer is still encoded
      const inner = zlib.gzipSync(Buffer.from('plain'))
      const ctx = responseCtx({ 'content-encoding': 'gzip, gzip' }, inner, { isGunzipped: true })

      await adapter.compressBody(ctx)

      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('does not decode again when earlier middleware already decoded the only layer', async () => {
      const ctx = responseCtx({ 'content-encoding': 'br' }, 'plain', { isBrotliDecompressed: true })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(await readStream(ctx.incomingResStream)).toBe('plain')
      expect(ctx.res.removeHeader).toHaveBeenCalledWith('content-encoding')
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('keeps the body and header pair when the encoding cannot be undone', async () => {
      const ctx = responseCtx({ 'content-encoding': 'zstd' })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.res.removeHeader).not.toHaveBeenCalled()
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('keeps the pair when only part of a layered encoding can be undone', async () => {
      const ctx = responseCtx({ 'content-encoding': 'gzip, zstd' })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.res.removeHeader).not.toHaveBeenCalled()
      expect(ctx.res.setHeader).not.toHaveBeenCalled()
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })

    it('drops a peeled layer from the header when the rest cannot be undone', async () => {
      // makeResStreamPlainText already peeled the outer gzip for earlier
      // middleware; the zstd core cannot be undone or re-encoded here, so the
      // shipped header must describe what the body actually still is
      const ctx = responseCtx({ 'content-encoding': 'zstd, gzip' }, 'still-zstd-encoded', { isGunzipped: true })
      const original = ctx.incomingResStream

      await adapter.compressBody(ctx)

      expect(ctx.incomingResStream).toBe(original)
      expect(ctx.res.setHeader).toHaveBeenCalledWith('content-encoding', 'zstd')
      expect(ctx.res.removeHeader).not.toHaveBeenCalled()
      expect(ctx.next).toHaveBeenCalledTimes(1)
    })
  })
})
