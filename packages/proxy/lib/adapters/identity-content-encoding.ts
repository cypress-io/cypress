import zlib from 'zlib'
import type { Readable, Transform } from 'stream'
import type { ForContentEncoding } from '@packages/network-interception'

type RequestCtx = {
  next: () => void
}

type ResponseCtx = {
  incomingRes: { headers: Record<string, string | string[] | undefined> }
  incomingResStream: Readable
  isGunzipped?: boolean
  isBrotliDecompressed?: boolean
  res: { removeHeader: (name: string) => void, setHeader: (name: string, value: string) => void }
  onError: (error: Error) => void
  next: () => void
}

// Lenient flush options tolerate truncated or slightly invalid input, matching
// the decompression the rest of the pipeline applies to upstream bodies.
const zlibDecompressOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
}

const brotliDecompressOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
}

// What this adapter can undo is its own property — a stub may declare any
// encoding regardless of what the wire pipeline negotiates with origins.
// Deliberately broader than the wire path's gzip/br set: this path only ever
// decodes, while the wire path must also re-encode whatever it undoes. So
// stub-declared x-gzip/deflate render correctly on this pipeline, while the
// MITM pipeline still treats them as opaque (see cypress-io/cypress#34387).
const STREAM_DECODERS: Record<string, () => Transform> = {
  gzip: () => zlib.createGunzip(zlibDecompressOptions),
  'x-gzip': () => zlib.createGunzip(zlibDecompressOptions),
  deflate: () => zlib.createInflate(zlibDecompressOptions),
  br: () => zlib.createBrotliDecompress(brotliDecompressOptions),
}

function parseContentEncoding (header?: string | string[]): string[] {
  return ([] as string[]).concat(header ?? [])
  .join(',')
  .split(',')
  .map((token) => token.trim().toLowerCase())
  .filter((token) => token && token !== 'identity')
}

// makeResStreamPlainText decodes at most one gzip and one br layer, always the
// outermost occurrence of each — mirror that when reporting what remains.
function withoutPeeledLayers (encodings: string[], ctx: Pick<ResponseCtx, 'isGunzipped' | 'isBrotliDecompressed'>): string[] {
  const remaining = [...encodings]
  const peel = (token: string, peeled?: boolean) => {
    const index = peeled ? remaining.lastIndexOf(token) : -1

    if (index !== -1) {
      remaining.splice(index, 1)
    }
  }

  peel('gzip', ctx.isGunzipped)
  peel('br', ctx.isBrotliDecompressed)

  return remaining
}

/**
 * {@link ForContentEncoding} implementation for pipelines where the browser
 * performs the transfer: it negotiates its own `accept-encoding` and decodes
 * what the origin sends, so the body handed back to it must be identity.
 *
 * Lives here rather than with the port: @packages/network-interception is
 * isomorphic (the driver bundles its index into the browser), and this
 * adapter needs node builtins.
 */
export class IdentityContentEncodingAdapter implements ForContentEncoding {
  constrainAcceptEncoding (context: unknown): void {
    // The browser owns accept-encoding negotiation on this pipeline.
    const ctx = context as RequestCtx

    ctx.next()
  }

  async compressBody (context: unknown): Promise<void> {
    const ctx = context as ResponseCtx
    // The transport strips the origin's encoding headers on the way in, so a
    // surviving one was declared by a `cy.intercept` stub over a body this
    // pipeline never decoded — e.g. replaying a recorded response verbatim:
    //   req.reply({ headers: { 'content-encoding': 'gzip' }, body: recordedGzipBytes })
    // Over a real socket the browser's netstack decodes that; a fulfilled
    // response runs no decoders, so this adapter has to.
    const contentEncoding = ctx.incomingRes.headers['content-encoding']

    if (!contentEncoding) {
      return ctx.next()
    }

    const encodings = parseContentEncoding(contentEncoding)

    // A header that names nothing to decode (bare `identity`) just gets dropped.
    if (!encodings.length) {
      ctx.res.removeHeader('content-encoding')

      return ctx.next()
    }

    // An encoding we cannot undo has to ship as the pair it arrived as — a body
    // that lies about its encoding is worse than one the browser rejects. But
    // makeResStreamPlainText may already have peeled the outermost gzip/br
    // layer for earlier middleware, and this path cannot re-encode it the way
    // the wire path does — so drop the peeled tokens from the header to keep
    // the shipped pair consistent.
    if (!encodings.every((encoding) => STREAM_DECODERS[encoding])) {
      const remaining = withoutPeeledLayers(encodings, ctx)

      if (remaining.length !== encodings.length) {
        ctx.res.setHeader('content-encoding', remaining.join(', '))
      }

      return ctx.next()
    }

    // Earlier middleware may already have decoded the outermost gzip or br
    // layer through makeResStreamPlainText (it decodes each of those at most
    // once, tracked by these flags) — skip one matching layer so the stream is
    // never decoded twice.
    let gzipAlreadyDecoded = Boolean(ctx.isGunzipped)
    let brotliAlreadyDecoded = Boolean(ctx.isBrotliDecompressed)

    // Encodings are listed in the order applied — decode outermost first.
    for (let i = encodings.length - 1; i >= 0; i--) {
      const encoding = encodings[i]

      if (encoding === 'gzip' && gzipAlreadyDecoded) {
        gzipAlreadyDecoded = false
        continue
      }

      if (encoding === 'br' && brotliAlreadyDecoded) {
        brotliAlreadyDecoded = false
        continue
      }

      ctx.incomingResStream = ctx.incomingResStream.pipe(STREAM_DECODERS[encoding]()).on('error', ctx.onError)
    }

    ctx.res.removeHeader('content-encoding')

    ctx.next()
  }
}
