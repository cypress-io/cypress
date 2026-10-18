import nock from 'nock'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { encode, decode } from '@packages/socket/lib/utils'
import { compactHttpResponse, expandHttpResponse } from '@packages/types'
import { Request } from '../../lib/request'

const request = new Request({ timeout: 100 })

const automationFn = vi.fn((msg: string) => {
  return Promise.resolve(msg === 'get:cookies' ? [] : {})
})

// The same round trip `socket-base` and the socket client perform for `backend:request`
const overTheWire = async (value: unknown) => {
  const encoded = await encode(['response', value], '/')

  return { encoded, decoded: (await decode(encoded))[1] }
}

const sharesBody = (resp: any) => resp.body === resp.allRequestResponses.at(-1)['Response Body']

const shapes: { name: string, send: () => Promise<any> }[] = [
  {
    name: 'JSON that parses',
    send: () => {
      // Formatting the server's parse would not preserve, to prove the raw text survives
      nock('http://localhost:1234').get('/').reply(200, '{ "a": 1.0, "big": 12345678901234567890, "b": [1, 2] }', { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'JSON content type that fails to parse',
    send: () => {
      nock('http://localhost:1234').get('/').reply(200, '{ not json', { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'non-JSON text',
    send: () => {
      nock('http://localhost:1234').get('/').reply(200, '<html>hi</html>', { 'Content-Type': 'text/html' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'empty body',
    send: () => {
      nock('http://localhost:1234').get('/').reply(204, '')

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    },
  },
  {
    name: 'JSON body parsed by `json: true`',
    send: () => {
      nock('http://localhost:1234').post('/').reply(200, { created: true }, { 'Content-Type': 'application/json' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', method: 'POST', json: true, body: { a: 1 }, cookies: false })
    },
  },
  {
    name: 'redirect chain',
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
    send: () => {
      nock('http://localhost:1234').get('/').reply(302, 'Found', { location: '/next' })

      return request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', followRedirect: false, cookies: false })
    },
  },
]

describe('lib/request responses over the socket', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  for (const { name, send } of shapes) {
    describe(name, () => {
      it('expands back to the exact `sendPromise` result, key order included', async () => {
        const resp = await send()
        const expanded = expandHttpResponse(compactHttpResponse(resp))

        expect(expanded).toStrictEqual(resp)
        expect(Object.keys(expanded)).toEqual(Object.keys(resp))
      })

      it('arrives over the wire identical to the uncompacted response', async () => {
        const resp = await send()
        const before = await overTheWire(resp)
        const after = await overTheWire(compactHttpResponse(resp))

        const expanded = expandHttpResponse(after.decoded)

        expect(expanded).toStrictEqual(before.decoded)
        expect(Object.keys(expanded)).toEqual(Object.keys(before.decoded))
        // The serializer preserves shared references, so whether `body` is the
        // logged object itself is observable and must not change either
        expect(sharesBody(expanded)).toBe(sharesBody(before.decoded))
      })
    })
  }

  it('keeps a `json: true` body as the same object as the logged one, as the uncompacted wire does', async () => {
    const resp = await shapes.find(({ name }) => name.includes('json: true'))!.send()
    const before = await overTheWire(resp)
    const after = await overTheWire(compactHttpResponse(resp))

    expect(sharesBody(before.decoded)).toBe(true)
    expect(sharesBody(expandHttpResponse(after.decoded))).toBe(true)
  })

  it('roughly halves the encoded payload for a large JSON body', async () => {
    const items = Array.from({ length: 1000 }, (_value, id) => ({ id, name: `item-${id}`, tags: ['x', 'y', 'z'] }))

    nock('http://localhost:1234').get('/').reply(200, JSON.stringify(items), { 'Content-Type': 'application/json' })

    const resp = await request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', cookies: false })
    const before = await overTheWire(resp)
    const after = await overTheWire(compactHttpResponse(resp))

    expect(after.encoded.length / before.encoded.length).toBeLessThan(0.55)
  })

  it('keeps the raw JSON text byte for byte rather than re-serializing the parsed body', async () => {
    const resp = await shapes[0]!.send()
    const { decoded } = await overTheWire(compactHttpResponse(resp))
    const expanded = expandHttpResponse(decoded)

    expect(expanded.allRequestResponses[0]['Response Body']).toBe('{ "a": 1.0, "big": 12345678901234567890, "b": [1, 2] }')
    expect(expanded.body).toStrictEqual({ a: 1, big: 12345678901234567000, b: [1, 2] })
  })

  it('sends a binary body (`encoding: null`) as one attachment instead of two', async () => {
    const bytes = Buffer.from([0, 1, 2, 255, 254])

    nock('http://localhost:1234').get('/').reply(200, bytes, { 'Content-Type': 'application/octet-stream' })

    const resp = await request.sendPromise({}, automationFn, { url: 'http://localhost:1234/', encoding: null, cookies: false })

    const before = await overTheWire(resp)
    const after = await overTheWire(compactHttpResponse(resp))

    // engine.io marks each binary attachment as a base64 packet prefixed with `b`
    const attachments = (encoded: string) => encoded.split('\x1e').filter((packet) => packet.startsWith('b')).length

    expect(attachments(before.encoded)).toBe(2)
    expect(attachments(after.encoded)).toBe(1)

    // Node decodes attachments to Buffers where the browser gets ArrayBuffers,
    // so compare the bytes and the separate-copy guarantee rather than the types
    const expanded = expandHttpResponse(after.decoded)
    const raw = expanded.allRequestResponses[0]['Response Body']

    expect(Buffer.from(expanded.body)).toStrictEqual(bytes)
    expect(Buffer.from(raw)).toStrictEqual(bytes)
    expect(sharesBody(before.decoded)).toBe(false)
    expect(expanded.body).not.toBe(raw)
    expect(Object.keys(expanded)).toEqual(Object.keys(before.decoded))
  })
})
