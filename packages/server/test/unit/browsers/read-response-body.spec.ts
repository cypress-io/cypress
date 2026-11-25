import type { Protocol } from 'devtools-protocol'
import { describe, expect, it, vi } from 'vitest'
import {
  BODY_READ_CHUNK_BYTES,
  READ_WHOLE_BODY_MAX_BYTES,
  isTakenBodyReadError,
  mayExceedWholeReadLimit,
  readResponseBody,
} from '../../../lib/browsers/cdp-protocol/read-response-body'

const scriptBody = 'function frameBusting(){if(window.top!==window.self){window.top.location=window.location}}\n'

const responsePause = (responseHeaders?: Protocol.Fetch.HeaderEntry[]): Protocol.Fetch.RequestPausedEvent => {
  return {
    requestId: 'interception-job-71.0',
    frameId: 'frame-1',
    resourceType: 'Script',
    request: { url: 'https://app.example.test/main.js', method: 'GET', headers: {} },
    responseStatusCode: 200,
    responseHeaders,
  } as Protocol.Fetch.RequestPausedEvent
}

// Answers each CDP command from the map; a command missing from it rejects.
const createClient = (answers: Record<string, (params: any) => unknown>) => {
  return {
    send: vi.fn(async (command: string, params?: any) => {
      const answer = answers[command]

      if (!answer) {
        throw new Error(`unexpected ${command}`)
      }

      return answer(params)
    }),
  }
}

describe('lib/browsers/cdp-protocol/read-response-body', () => {
  describe('mayExceedWholeReadLimit', () => {
    it('reads a body whose Content-Length is within the limit whole', () => {
      expect(mayExceedWholeReadLimit([{ name: 'Content-Length', value: '48213' }])).toBe(false)
      expect(mayExceedWholeReadLimit([{ name: 'content-length', value: String(READ_WHOLE_BODY_MAX_BYTES) }])).toBe(false)
    })

    it('reads a body over the limit in chunks', () => {
      expect(mayExceedWholeReadLimit([{ name: 'Content-Length', value: String(READ_WHOLE_BODY_MAX_BYTES + 1) }])).toBe(true)
    })

    it('reads a body without a usable Content-Length in chunks', () => {
      expect(mayExceedWholeReadLimit([{ name: 'Content-Type', value: 'application/javascript' }])).toBe(true)
      expect(mayExceedWholeReadLimit([{ name: 'Content-Length', value: '1e6' }])).toBe(true)
      expect(mayExceedWholeReadLimit(undefined)).toBe(true)
    })

    it('reads a gzip or deflate body whole when it cannot decode past the limit', () => {
      const largestWholeRead = String(Math.floor(READ_WHOLE_BODY_MAX_BYTES / 1032))

      for (const encoding of ['gzip', 'x-gzip', 'Deflate']) {
        expect(mayExceedWholeReadLimit([
          { name: 'Content-Length', value: largestWholeRead },
          { name: 'Content-Encoding', value: encoding },
        ])).toBe(false)
      }

      expect(mayExceedWholeReadLimit([
        { name: 'Content-Length', value: String(Number(largestWholeRead) + 1) },
        { name: 'Content-Encoding', value: 'gzip' },
      ])).toBe(true)
    })

    it('reads a compressed body in chunks when its decoded size is unbounded', () => {
      expect(mayExceedWholeReadLimit([
        { name: 'Content-Length', value: '48213' },
        { name: 'Content-Encoding', value: 'gzip' },
      ])).toBe(true)

      for (const encoding of ['br', 'zstd', 'gzip, br']) {
        expect(mayExceedWholeReadLimit([
          { name: 'Content-Length', value: '43' },
          { name: 'Content-Encoding', value: encoding },
        ])).toBe(true)
      }

      expect(mayExceedWholeReadLimit([{ name: 'Content-Encoding', value: 'gzip' }])).toBe(true)
    })

    it('treats Content-Encoding: identity as uncompressed', () => {
      expect(mayExceedWholeReadLimit([
        { name: 'Content-Length', value: '48213' },
        { name: 'Content-Encoding', value: 'identity' },
      ])).toBe(false)
    })
  })

  describe('readResponseBody', () => {
    it('reads the body whole with Fetch.getResponseBody', async () => {
      const client = createClient({
        'Fetch.getResponseBody': () => ({ body: Buffer.from(scriptBody).toString('base64'), base64Encoded: true }),
      })

      const result = await readResponseBody(client, responsePause(), { inChunks: false, sessionId: 'session-1' })

      expect(result).toEqual({ body: Buffer.from(scriptBody), taken: false })
      expect(client.send).toHaveBeenCalledWith('Fetch.getResponseBody', { requestId: 'interception-job-71.0' }, 'session-1')
    })

    it('reads the body in chunks until eof and closes the stream', async () => {
      const reads = [
        { data: scriptBody.slice(0, 40), base64Encoded: false, eof: false },
        { data: Buffer.from(scriptBody.slice(40)).toString('base64'), base64Encoded: true, eof: false },
        { data: '', base64Encoded: false, eof: true },
      ]
      const client = createClient({
        'Fetch.takeResponseBodyAsStream': () => ({ stream: 'stream-7' }),
        'IO.read': () => reads.shift(),
        'IO.close': () => ({}),
      })

      const result = await readResponseBody(client, responsePause(), { inChunks: true, sessionId: 'session-1' })

      expect(result).toEqual({ body: Buffer.from(scriptBody), taken: true })
      expect(client.send).toHaveBeenCalledWith('Fetch.takeResponseBodyAsStream', { requestId: 'interception-job-71.0' }, 'session-1')
      expect(client.send).toHaveBeenCalledWith('IO.read', { handle: 'stream-7', size: BODY_READ_CHUNK_BYTES }, 'session-1')
      expect(client.send.mock.calls.filter(([command]) => command === 'IO.read')).toHaveLength(3)
      expect(client.send).toHaveBeenLastCalledWith('IO.close', { handle: 'stream-7' }, 'session-1')
    })

    it('reports a read that breaks off as a taken-body error, and still closes the stream', async () => {
      const client = createClient({
        'Fetch.takeResponseBodyAsStream': () => ({ stream: 'stream-7' }),
        'IO.read': () => {
          throw new Error('Invalid stream handle')
        },
        'IO.close': () => ({}),
      })

      const err = await readResponseBody(client, responsePause(), { inChunks: true }).catch((e) => e)

      expect(isTakenBodyReadError(err)).toBe(true)
      expect(err.message).toBe('Could not read the body of https://app.example.test/main.js: Invalid stream handle')
      expect(client.send).toHaveBeenCalledWith('IO.close', { handle: 'stream-7' }, undefined)
    })

    it('reports a body that could not be taken as an ordinary error, since Chrome still holds it', async () => {
      const client = createClient({
        'Fetch.takeResponseBodyAsStream': () => {
          throw new Error('Invalid InterceptionId.')
        },
      })

      const err = await readResponseBody(client, responsePause(), { inChunks: true }).catch((e) => e)

      expect(isTakenBodyReadError(err)).toBe(false)
      expect(err.message).toBe('Invalid InterceptionId.')
    })
  })
})
