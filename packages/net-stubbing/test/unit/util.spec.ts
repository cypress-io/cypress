import { afterEach, describe, it, expect, vi } from 'vitest'
import { getBodyEncoding, getBodyStream, parseContentType } from '../../lib/server/util'
import { Readable } from 'stream'
import { join } from 'path'
import { readFileSync } from 'fs'

const imageBuffer = readFileSync(join(__dirname, '..', 'fixtures', 'cypress-logo.png'))

function collectStream (stream: Readable) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString())
    })

    stream.on('error', reject)
  })
}

describe('net-stubbing util', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('parseContentType', () => {
    it('returns application/json', () => {
      const str = JSON.stringify({ foo: 'bar' })

      expect(parseContentType(str)).toEqual('application/json')
    })

    it('returns text/html', () => {
      const str = `\
<html>
  <body>foobarbaz</body>
</html>\
`

      expect(parseContentType(str)).toEqual('text/html')
    })

    it('returns text/plain', () => {
      const str = 'foobar<p>baz'

      expect(parseContentType(str)).toEqual('text/plain')
    })

    it('returns text/plain by default', () => {
      expect(parseContentType()).toEqual('text/plain')
    })
  })

  describe('getBodyEncoding', () => {
    it('returns null without data', () => {
      expect(getBodyEncoding(null)).toBeNull()

      const emptyRequest = {
        body: null,
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(emptyRequest)).toBeNull()
    })

    it('returns utf8', () => {
      // possible content-type variants
      // https://tools.ietf.org/html/rfc7231#section-3.1.1.1
      const types = [
        'text/html;charset=utf-8',
        'text/html;charset=UTF-8',
        'Text/HTML;Charset="utf-8"',
        'text/html; charset="utf-8"',
      ]

      types.forEach((contentType) => {
        const req = {
          body: 'some data',
          headers: {
            'content-type': contentType,
          },
          method: 'POST',
          url: 'somewhere',
          httpVersion: '1.1',
        }

        expect(getBodyEncoding(req), contentType).toEqual('utf8')
      })
    })

    it('falls back to inspecting bytes to find text', () => {
      const req = {
        body: Buffer.from('hello world'),
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(req), 'text').toEqual('utf8')
    })

    it('falls back to inspecting bytes to find image', () => {
      const req = {
        body: imageBuffer,
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(req), 'image').toEqual('binary')
    })
  })

  describe('getBodyStream', () => {
    it('applies delay before throttling the body', async () => {
      vi.useFakeTimers()

      const payload = 'A'.repeat(10 * 1024)
      const throttleKbps = 10
      const delay = 250
      const expectedThrottleMs = payload.length / (1024 * throttleKbps) * 1000
      let bodyStream: Readable | undefined
      let body: string | undefined

      const bodyStreamPromise = getBodyStream(payload, { delay, throttleKbps }).then((stream) => {
        bodyStream = stream

        return stream
      })

      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(bodyStream).toBeUndefined()

      await vi.advanceTimersByTimeAsync(1)
      const stream = await bodyStreamPromise
      const bodyPromise = collectStream(stream).then((result) => {
        body = result

        return result
      })

      await vi.advanceTimersByTimeAsync(expectedThrottleMs - 1)
      expect(body).toBeUndefined()

      await vi.advanceTimersByTimeAsync(1)
      expect(await bodyPromise).toEqual(payload)
    })
  })
})
