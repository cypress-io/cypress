import type { CypressIncomingRequest, CypressOutgoingResponseLike } from '@packages/proxy'

type Debug = (formatter: string, ...args: any[]) => void

/**
 * Buffer the body of an incoming proxied request so it can be handed to
 * `cy.intercept` handlers and yielded by `cy.wait`.
 *
 * The browser can close the connection before we get here — a page navigation, an
 * aborted fetch/XHR, or a component unmounting between tests. Node destroys the
 * request stream at that point and it stops emitting `readable`/`end`, so reading
 * it as a stream alone would never settle. Whatever the HTTP parser already
 * received is still sitting in the readable buffer, so drain it synchronously
 * instead of reporting a body the browser never sent.
 */
export function bufferRequestBody (
  req: CypressIncomingRequest,
  res: CypressOutgoingResponseLike,
  debug: Debug,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = []
    let settled = false

    const drain = (): void => {
      let chunk: Buffer | string | null

      while ((chunk = req.read()) !== null) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
    }

    const finish = (): void => {
      if (settled) {
        return
      }

      settled = true
      req.off('readable', drain)
      req.off('end', finish)
      req.off('close', onConnectionClosed)
      res.off('close', onConnectionClosed)

      resolve(Buffer.concat(chunks))
    }

    const onConnectionClosed = (): void => {
      if (settled) {
        return
      }

      drain()

      const recovered = chunks.reduce((length, chunk) => length + chunk.length, 0)

      debug('cy.intercept: the connection closed before the request body was read, recovered %d buffered byte(s)', recovered)

      finish()
    }

    req.on('readable', drain)
    req.once('end', finish)
    req.once('close', onConnectionClosed)
    res.once('close', onConnectionClosed)

    if (res.destroyed || req.destroyed) {
      onConnectionClosed()
    }
  })
}
