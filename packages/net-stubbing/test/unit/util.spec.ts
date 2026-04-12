import { describe, it, expect } from 'vitest'
import { getBodyEncoding, mergeDeletedHeaders, mergeWithPreservedBuffers, parseContentType, pickFromIncomingMessage } from '../../lib/server/util'
import { join } from 'path'
import { readFileSync } from 'fs'

const imageBuffer = readFileSync(join(__dirname, '..', 'fixtures', 'cypress-logo.png'))

describe('net-stubbing util', () => {
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

  describe('mergeWithPreservedBuffers', () => {
    it('deep-merges nested plain objects', () => {
      const before: any = {
        headers: {
          'content-type': 'text/html',
          nested: { deep: 'value', keep: 'this' },
        },
        body: 'original',
      }

      mergeWithPreservedBuffers(before, {
        headers: {
          nested: { deep: 'changed', extra: 'new' },
        },
      } as any)

      expect(before.headers.nested).toEqual({ deep: 'changed', keep: 'this', extra: 'new' })
      expect(before.headers['content-type']).toEqual('text/html')
      expect(before.body).toEqual('original')
    })

    it('replaces arrays wholesale', () => {
      const before: any = {
        headers: {
          'set-cookie': ['a=1', 'b=2'],
        },
        body: 'original',
      }

      mergeWithPreservedBuffers(before, {
        headers: {
          'set-cookie': ['c=3'],
        },
      } as any)

      expect(before.headers['set-cookie']).toEqual(['c=3'])
    })

    it('preserves Buffer values without merging', () => {
      const buf = Buffer.from('hello')
      const before: any = {
        headers: {},
        body: 'original',
      }

      mergeWithPreservedBuffers(before, {
        body: buf,
      } as any)

      expect(Buffer.isBuffer(before.body)).toBe(true)
      expect(before.body).toBe(buf)
    })

    it('does not merge into a Buffer when target is a Buffer', () => {
      const originalBuf = Buffer.from('original')
      const newBuf = Buffer.from('new')
      const before: any = {
        headers: {},
        body: originalBuf,
      }

      mergeWithPreservedBuffers(before, {
        body: newBuf,
      } as any)

      expect(before.body).toBe(newBuf)
    })

    it('adds new nested properties', () => {
      const before: any = {
        headers: {
          existing: 'value',
        },
        body: 'original',
      }

      mergeWithPreservedBuffers(before, {
        headers: {
          'x-new-header': 'added',
        },
      } as any)

      expect(before.headers['x-new-header']).toEqual('added')
      expect(before.headers.existing).toEqual('value')
    })

    it('handles deeply nested objects beyond two levels', () => {
      const before: any = {
        headers: {
          meta: { level1: { level2: 'original', preserved: true } },
        },
        body: 'original',
      }

      mergeWithPreservedBuffers(before, {
        headers: {
          meta: { level1: { level2: 'changed', added: 'new' } },
        },
      } as any)

      expect(before.headers.meta.level1).toEqual({
        level2: 'changed',
        preserved: true,
        added: 'new',
      })
    })
  })

  describe('pickFromIncomingMessage', () => {
    it('picks inherited properties from a prototype-backed object', () => {
      const proto = {
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        url: '/api/test',
      }

      const obj = Object.create(proto)

      const result = pickFromIncomingMessage(obj, ['headers', 'method', 'url', 'missing'])

      expect(result).toEqual({
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        url: '/api/test',
      })
    })

    it('picks own properties', () => {
      const obj = {
        headers: { host: 'localhost' },
        method: 'POST',
        statusCode: 200,
      }

      const result = pickFromIncomingMessage(obj, ['headers', 'method', 'statusCode'])

      expect(result).toEqual({
        headers: { host: 'localhost' },
        method: 'POST',
        statusCode: 200,
      })
    })

    it('omits keys not present on the object or its prototype', () => {
      const obj = Object.create({ headers: {} })

      const result = pickFromIncomingMessage(obj, ['headers', 'nonexistent'])

      expect(result).toEqual({ headers: {} })
    })
  })

  describe('mergeDeletedHeaders', () => {
    it('deletes headers omitted from after', () => {
      const before = { headers: { 'x-keep': 'yes', 'x-remove': 'bye' } } as any
      const after = { headers: { 'x-keep': 'yes' } } as any

      mergeWithPreservedBuffers(before, after)
      mergeDeletedHeaders(before, after)

      expect(before.headers).toEqual({ 'x-keep': 'yes' })
    })

    it('preserves headers set to empty string in after', () => {
      const before = { headers: { 'x-keep': 'original', 'x-empty': 'was-full' } } as any
      const after = { headers: { 'x-keep': 'original', 'x-empty': '' } } as any

      mergeWithPreservedBuffers(before, after)
      mergeDeletedHeaders(before, after)

      expect(before.headers).toEqual({ 'x-keep': 'original', 'x-empty': '' })
    })
  })
})
