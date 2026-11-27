import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import type { ICriClient } from './cri-client'

const debug = debugModule('cypress:server:browsers:cdp-protocol:read-response-body')

// A body up to this size is read with one Fetch.getResponseBody. Anything that
// could be larger is read in chunks: Chrome sends a getResponseBody reply as a
// single DevTools message, and on some Windows machines a reply of a few MB
// never arrives, which stalls every later message on the connection (#34969).
export const READ_WHOLE_BODY_MAX_BYTES = 1024 * 1024

export const BODY_READ_CHUNK_BYTES = 1024 * 1024

type ReadBodyClient = Pick<ICriClient, 'send'>

export type ResponseBody = {
  body: Buffer
  // Fetch.takeResponseBodyAsStream consumed the body. Chrome then refuses
  // Fetch.continueResponse, and a refused continue also fails any later
  // Fetch.fulfillRequest, so the pause must be fulfilled with a body or failed.
  taken: boolean
}

/**
 * Thrown when reading a taken body fails partway: the pause can neither be
 * continued nor fulfilled with the complete body, so it has to be failed.
 */
export class TakenBodyReadError extends Error {
  readonly bodyTaken = true
}

export const isTakenBodyReadError = (err: unknown): err is TakenBodyReadError => {
  return err instanceof TakenBodyReadError
}

const headerValue = (headers: Protocol.Fetch.HeaderEntry[] | undefined, name: string): string | undefined => {
  return headers?.find((header) => header.name.toLowerCase() === name)?.value
}

// Deflate, and gzip which wraps it, expand a body at most 1032 times.
const DEFLATE_MAX_EXPANSION = 1032

const DEFLATE_ENCODINGS = new Set(['gzip', 'x-gzip', 'deflate'])

/**
 * Whether the decoded body may be larger than READ_WHOLE_BODY_MAX_BYTES.
 * Both read methods return the decoded body, so a compressed Content-Length
 * only bounds it for gzip or deflate: `Content-Encoding: gzip` with
 * `Content-Length: 1000` reads whole, with `Content-Length: 2000` in chunks.
 * A missing Content-Length, or any other encoding, reads in chunks.
 *
 * Reading whole keeps a small corrupt gzip body failing the way the origin
 * sent it. Chrome reads such a body as empty without an error, so once its
 * body is taken it can only be fulfilled as an empty, valid response; a body
 * read whole and left unchanged is continued, and Chrome then fails it with
 * net::ERR_CONTENT_DECODING_FAILED.
 */
export function mayExceedWholeReadLimit (responseHeaders: Protocol.Fetch.HeaderEntry[] | undefined): boolean {
  const contentLength = headerValue(responseHeaders, 'content-length')

  if (!contentLength || !/^\d+$/.test(contentLength.trim())) {
    return true
  }

  const contentEncoding = headerValue(responseHeaders, 'content-encoding')?.trim().toLowerCase()
  let maxDecodedBytes = Number(contentLength)

  if (contentEncoding && contentEncoding !== 'identity') {
    if (!DEFLATE_ENCODINGS.has(contentEncoding)) {
      return true
    }

    maxDecodedBytes *= DEFLATE_MAX_EXPANSION
  }

  return maxDecodedBytes > READ_WHOLE_BODY_MAX_BYTES
}

const readTakenBody = async (client: ReadBodyClient, stream: string, url: string, sessionId?: string): Promise<Buffer> => {
  const chunks: Buffer[] = []
  let reads = 0

  try {
    for (;;) {
      const { data, base64Encoded, eof } = await client.send('IO.read', { handle: stream, size: BODY_READ_CHUNK_BYTES }, sessionId)

      reads++
      chunks.push(Buffer.from(data, base64Encoded ? 'base64' : 'utf8'))

      if (eof) {
        break
      }
    }
  } catch (err) {
    throw new TakenBodyReadError(`Could not read the body of ${url}: ${(err as Error).message}`)
  } finally {
    await client.send('IO.close', { handle: stream }, sessionId).catch((err) => {
      debug('could not close the body stream of %s: %s', url, (err as Error).message)
    })
  }

  const body = Buffer.concat(chunks)

  debug('read %d byte(s) of %s in %d chunk(s)', body.length, url, reads)

  return body
}

/**
 * Reads the body of a response-stage Fetch pause: whole, or in chunks that
 * keep every message Chrome sends for it to about BODY_READ_CHUNK_BYTES.
 */
export async function readResponseBody (client: ReadBodyClient, event: Protocol.Fetch.RequestPausedEvent, { inChunks, sessionId }: { inChunks: boolean, sessionId?: string }): Promise<ResponseBody> {
  if (!inChunks) {
    const { body, base64Encoded } = await client.send('Fetch.getResponseBody', { requestId: event.requestId }, sessionId)

    return { body: Buffer.from(body, base64Encoded ? 'base64' : 'utf8'), taken: false }
  }

  const { stream } = await client.send('Fetch.takeResponseBodyAsStream', { requestId: event.requestId }, sessionId)

  return { body: await readTakenBody(client, stream, event.request.url, sessionId), taken: true }
}
