import nock from 'nock'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { encode, decode } from '@packages/socket/lib/utils'
import { HTTP_RESPONSE_BODY_HINT } from '@packages/types'
import { compactHttpResponse } from '../../../lib/util/compact-http-response'
import { Request } from '../../../lib/request'

const request = new Request({ timeout: 100 })

const automationFn = vi.fn((msg: string) => {
  return Promise.resolve(msg === 'get:cookies' ? [] : {})
})

// The same round trip `socket-base` and the socket client perform for `backend:request`
const overTheWire = async (value: unknown) => {
  const encoded = await encode(['response', value], '/')

  return { encoded, decoded: (await decode(encoded))[1] }
}

const finalResponseBody = (resp: any) => resp.allRequestResponses.at(-1)['Response Body']

const sharesBody = (resp: any) => resp.body === finalResponseBody(resp)

const entry = (responseBody: unknown, overrides: Record<string, unknown> = {}) => {
  return {
    'Request Body': null,
    'Request Headers': { accept: '*/*' },
    'Request URL': 'http://localhost:1234/',
    'Response Body': responseBody,
    'Response Headers': { 'content-type': 'application/json' },
    'Response Status': 200,
    ...overrides,
  }
}

const response = (body: unknown, allRequestResponses: Record<string, unknown>[]) => {
  return { body, status: 200, allRequestResponses }
}

const shapes: { name: string, hint: string, send: () => Promise<any> }[] = [
  {
    name: 'JSON that parses',
    hint: 'json',
    send: () => {
      // `1.0` and the oversized integer change if parsed and re-serialized, so they show the raw text is kept as-is
      nock('http://localhost:1234').get('/').reply(200, '{ "a": 1.0, "big": 12345678901234567890, "b": [1, 2] }', { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'JSON content type that fails to parse',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').get('/').reply(200, '{ not json', { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'non-JSON text',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').get('/').reply(200, '<html>hi</html>', { 'Content-Type': 'text/html' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'empty body',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').get('/').reply(204, '')

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'JSON body parsed by `json: true`',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').post('/').reply(200, { created: true }, { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', method: 'POST', json: true, body: { a: 1 }, cookies: false })
    },
  },
  {
    name: 'binary body (`encoding: null`)',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').get('/').reply(200, Buffer.from([0, 1, 2, 255, 254]), { 'Content-Type': 'application/octet-stream' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', encoding: null, cookies: false })
    },
  },
  {
    name: 'redirect chain',
    hint: 'json',
    send: () => {
      nock('http://localhost:1234')
      .get('/').reply(302, 'first hop', { location: '/second' })
      .get('/second').reply(301, '', { location: '/third' })
      .get('/third').reply(200, '{"final":true}', { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: '`followRedirect: false` on a 3xx',
    hint: 'raw',
    send: () => {
      nock('http://localhost:1234').get('/').reply(302, 'Found', { location: '/next' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', followRedirect: false, cookies: false })
    },
  },
]

describe('lib/util/compact-http-response', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('real `sendPromise` responses', () => {
    for (const { name, hint, send } of shapes) {
      describe(name, () => {
        it('drops only `body`, keeping the raw value and the key order', async () => {
          const resp = await send()
          const compacted = compactHttpResponse(resp)
          const { body, ...rest } = resp

          expect(compacted).toStrictEqual({ ...rest, [HTTP_RESPONSE_BODY_HINT]: hint })
          expect(Object.keys(compacted)).toEqual([...Object.keys(rest), HTTP_RESPONSE_BODY_HINT])
        })

        it('hints how `body` derives from the raw value', async () => {
          const resp = await send()
          const raw = finalResponseBody(resp)

          if (hint === 'json') {
            expect(JSON.parse(raw)).toStrictEqual(resp.body)
          } else {
            expect(resp.body).toBe(raw)
          }
        })

        it('does not mutate the response', async () => {
          const resp = await send()
          const keys = Object.keys(resp)

          compactHttpResponse(resp)

          expect(Object.keys(resp)).toEqual(keys)
        })
      })
    }
  })

  describe('over the wire', () => {
    it('sends the raw JSON text byte for byte', async () => {
      const resp = await shapes[0]!.send()
      const { decoded } = await overTheWire(compactHttpResponse(resp))

      expect(decoded).not.toHaveProperty('body')
      expect(finalResponseBody(decoded)).toBe('{ "a": 1.0, "big": 12345678901234567890, "b": [1, 2] }')
    })

    it('roughly halves the encoded payload for a large JSON body', async () => {
      const items = Array.from({ length: 1000 }, (_value, id) => ({ id, name: `item-${id}`, tags: ['x', 'y', 'z'] }))

      nock('http://localhost:1234').get('/').reply(200, JSON.stringify(items), { 'Content-Type': 'application/json' })

      const resp = await request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
      const before = await overTheWire(resp)
      const after = await overTheWire(compactHttpResponse(resp))

      expect(after.encoded.length / before.encoded.length).toBeLessThan(0.55)
    })

    // The driver relies on these two facts about uncompacted responses to rebuild `body` with the same identity
    it('delivers an uncompacted `json: true` body as the same object as the raw value', async () => {
      const resp = await shapes.find(({ name }) => name.includes('json: true'))!.send()
      const { decoded } = await overTheWire(resp)

      expect(sharesBody(decoded)).toBe(true)
    })

    it('delivers an uncompacted binary body as a separate copy, and a compacted one as one attachment', async () => {
      const resp = await shapes.find(({ name }) => name.includes('binary'))!.send()
      const before = await overTheWire(resp)
      const after = await overTheWire(compactHttpResponse(resp))

      // engine.io marks each binary attachment as a base64 packet prefixed with `b`
      const attachments = (encoded: string) => encoded.split('\x1e').filter((packet) => packet.startsWith('b')).length

      expect(sharesBody(before.decoded)).toBe(false)
      expect(attachments(before.encoded)).toBe(2)
      expect(attachments(after.encoded)).toBe(1)
      expect(Buffer.from(finalResponseBody(after.decoded))).toStrictEqual(Buffer.from([0, 1, 2, 255, 254]))
    })
  })

  it('keeps a server-side Buffer body as the single raw copy', () => {
    const raw = Buffer.from([0, 1, 2, 255])
    const compacted: any = compactHttpResponse(response(raw, [entry(raw)]))

    expect(compacted[HTTP_RESPONSE_BODY_HINT]).toBe('raw')
    expect(finalResponseBody(compacted)).toBe(raw)
  })

  it('leaves earlier redirect hops untouched', () => {
    const hops = [entry('first hop', { 'Response Status': 302 }), entry('{"x":1}')]
    const compacted: any = compactHttpResponse(response({ x: 1 }, hops))

    expect(compacted.allRequestResponses).toBe(hops)
  })

  describe('pass-through', () => {
    const inputs: [string, unknown][] = [
      ['a non-response object', { foo: 'bar' }],
      ['null', null],
      ['undefined', undefined],
      ['a string', 'foo'],
      ['an array', [1, 2]],
      ['a response with no `body` key', { allRequestResponses: [entry('x')] }],
      ['an empty `allRequestResponses`', { body: 'x', allRequestResponses: [] }],
      ['a non-array `allRequestResponses`', { body: 'x', allRequestResponses: 'nope' }],
      ['a `body` that differs from a non-string raw value', { body: undefined, allRequestResponses: [entry(null)] }],
    ]

    for (const [name, input] of inputs) {
      it(`returns ${name} unchanged`, () => {
        expect(compactHttpResponse(input)).toBe(input)
      })
    }
  })
})
