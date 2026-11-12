import { afterEach, describe, it, expect, vi } from 'vitest'
import { getBodyEncoding, getBodyStream, parseContentType } from '../../lib/server/util'
import type { Readable } from 'stream'
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

    it.each([
      ['empty string', '', 'text/plain'],
      ['plain text', 'hello world', 'text/plain'],
      ['JSON object', '{"a":"<b>x</b>"}', 'application/json'],
      ['JSON array', '[1,2]', 'application/json'],
      ['JSON scalar string', '"<b>x</b>"', 'text/html'],
      ['JSON number', '42', 'text/plain'],
      ['single-line html', '<p>hi</p>', 'text/html'],
      ['custom tags', '<foo>bar</foo>', 'text/html'],
      ['html fragment', '<div><span>a</span></div>', 'text/html'],
      ['doctype document', '<!DOCTYPE html>\n<html><head></head><body></body></html>', 'text/html'],
      ['CRLF document', '<html>\r\n<body>x</body>\r\n</html>', 'text/html'],
      ['xml', '<?xml version="1.0"?>\n<root><item>1</item></root>', 'text/html'],
      ['empty tags', '<>x</>', 'text/plain'],
      ['nothing between tags', '<a></a>', 'text/plain'],
      ['one char between tags', '<a>x</a>', 'text/html'],
      ['newline as only separator', '<a>\n</a>', 'text/html'],
      ['opening tag split across lines', '<a\n>x</a>', 'text/plain'],
      ['closing tag split across lines', '<a>x</a\n>', 'text/plain'],
      ['closing tag split by CR', '<a>x</a\r>', 'text/plain'],
      ['closing tag split by U+2028', '<a>x</a\u2028>', 'text/plain'],
      ['opening tag split by U+2029', '<a\u2029>x</a>', 'text/plain'],
      ['closing tag only', '</a>', 'text/plain'],
      ['opening tag only', '<a>hello', 'text/plain'],
      ['unclosed tag', 'foobar<p>baz', 'text/plain'],
      ['closing slash with no name', '<a>x</>', 'text/plain'],
      ['double slash closing', '<a>x<//>', 'text/html'],
      ['comparison operators', 'if (a < b && c > d) { x </ y > z }', 'text/html'],
      ['comparison operators across lines', 'a < b\nc > d\ne </ f\ng > h', 'text/plain'],
      ['windows path', 'C:\\Users\\me\\<dir>\\file.txt', 'text/plain'],
      ['windows paths with tags', '<C:\\a>\\b</C:\\c>', 'text/html'],
      ['csv with angle brackets', 'id,val\n1,<a>\n2,</b>\n', 'text/html'],
      ['multi-line log', 'line one\nline <two>\nline three\n', 'text/plain'],
    ])('%s', (_name, body, expected) => {
      expect(parseContentType(body)).toEqual(expected)
    })

    it('stays fast on adversarial input', () => {
      const adversarial = '<>'.repeat(25_000)
      const start = performance.now()

      expect(parseContentType(adversarial)).toEqual('text/plain')
      expect(parseContentType(`${adversarial}x</a`)).toEqual('text/plain')
      expect(parseContentType(`${adversarial}x</a>`)).toEqual('text/html')
      expect(parseContentType(`<a>${adversarial}</a>`)).toEqual('text/html')

      expect(performance.now() - start).toBeLessThan(200)
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
