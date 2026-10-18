import { describe, it, expect } from 'vitest'
import { compactHttpResponse, expandHttpResponse, HTTP_RESPONSE_BODY_HINT } from '../src/request-response'

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

// Mirrors the key order `normalizeResponse` and `sendPromise` produce
const response = (body: unknown, allRequestResponses: Record<string, unknown>[], extra: Record<string, unknown> = {}) => {
  return {
    body,
    headers: { 'content-type': 'application/json' },
    status: 200,
    statusText: 'OK',
    isOkStatusCode: true,
    requestHeaders: { accept: '*/*' },
    requestBody: undefined,
    duration: 12,
    allRequestResponses,
    ...extra,
  }
}

const roundTrip = <T>(resp: T) => expandHttpResponse(compactHttpResponse(resp))

describe('request-response', () => {
  describe('body shapes', () => {
    const cases: { name: string, resp: () => Record<string, unknown>, hint: string }[] = [
      {
        name: 'JSON that parses',
        resp: () => response({ a: 1, b: [1.5, 'x'] }, [entry('{ "a": 1, "b": [1.50, "x"] }')]),
        hint: 'json',
      },
      {
        name: 'JSON whose value is a string',
        resp: () => response('hello', [entry('"hello"')]),
        hint: 'json',
      },
      {
        name: 'JSON whose value is null',
        resp: () => response(null, [entry('null')]),
        hint: 'json',
      },
      {
        name: 'JSON content type that fails to parse',
        resp: () => {
          const raw = '{ not json'

          return response(raw, [entry(raw)])
        },
        hint: 'raw',
      },
      {
        name: 'non-JSON text',
        resp: () => {
          const raw = '<html><body>hi</body></html>'

          return response(raw, [entry(raw, { 'Response Headers': { 'content-type': 'text/html' } })])
        },
        hint: 'raw',
      },
      {
        name: 'empty body',
        resp: () => response('', [entry('')]),
        hint: 'raw',
      },
      {
        name: 'null body',
        resp: () => response(null, [entry(null)]),
        hint: 'raw',
      },
      {
        // A server Buffer reaches the browser as an ArrayBuffer, which is all `expand` sees
        name: 'binary body (encoding: null)',
        resp: () => {
          const raw = new Uint8Array([0, 1, 2, 255]).buffer

          return response(raw, [entry(raw)])
        },
        hint: 'raw',
      },
      {
        name: 'object already parsed by `json: true`',
        resp: () => {
          const raw = { already: 'parsed' }

          return response(raw, [entry(raw)])
        },
        hint: 'raw',
      },
      {
        name: 'redirect chain, where only the final entry duplicates the body',
        resp: () => {
          return response({ final: true }, [
            entry('Found. Redirecting to /second', { 'Response Status': 302 }),
            entry('', { 'Response Status': 301 }),
            entry('{"final":true}'),
          ], { redirects: ['302: http://localhost:1234/second', '301: http://localhost:1234/third'] })
        },
        hint: 'json',
      },
      {
        name: '`followRedirect: false` on a 3xx',
        resp: () => {
          const raw = 'Found. Redirecting to /next'

          return response(raw, [entry(raw, { 'Response Status': 302 })], {
            status: 302,
            redirectedToUrl: 'http://localhost:1234/next',
          })
        },
        hint: 'raw',
      },
    ]

    for (const { name, resp, hint } of cases) {
      describe(name, () => {
        it('drops `body` and records how to rebuild it', () => {
          const compacted = compactHttpResponse(resp())

          expect(compacted).not.toHaveProperty('body')
          expect(compacted).toHaveProperty(HTTP_RESPONSE_BODY_HINT, hint)
        })

        it('round-trips to an identical object, key order included', () => {
          const original = resp()
          const expanded = roundTrip(original)

          expect(expanded).toStrictEqual(original)
          expect(Object.keys(expanded)).toEqual(Object.keys(original))
        })

        it('does not mutate its input', () => {
          const original = resp()
          const keys = Object.keys(original)

          compactHttpResponse(original)

          expect(Object.keys(original)).toEqual(keys)
        })
      })
    }
  })

  it('keeps a server-side Buffer body as the single raw copy', () => {
    const raw = Buffer.from([0, 1, 2, 255])
    const compacted = compactHttpResponse(response(raw, [entry(raw)])) as Record<string, any>

    expect(compacted[HTTP_RESPONSE_BODY_HINT]).toBe('raw')
    expect(compacted.allRequestResponses[0]['Response Body']).toBe(raw)
  })

  it('leaves earlier redirect hops untouched', () => {
    const hops = [entry('first hop', { 'Response Status': 302 }), entry('{"x":1}')]
    const compacted = compactHttpResponse(response({ x: 1 }, hops)) as Record<string, any>

    expect(compacted.allRequestResponses).toBe(hops)
    expect(compacted.allRequestResponses[0]['Response Body']).toBe('first hop')
  })

  // The socket serializer keeps shared references intact but sends each binary
  // value as its own attachment, so these mirror what the browser received before
  it('gives an expanded binary body its own copy', () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer
    const binary = expandHttpResponse({ allRequestResponses: [entry(buffer)], [HTTP_RESPONSE_BODY_HINT]: 'raw' }) as Record<string, any>

    expect(binary.body).not.toBe(buffer)
    expect(binary.body).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(binary.body)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('shares an expanded object body with the logged one', () => {
    const parsed = { nested: { a: 1 } }
    const object = expandHttpResponse({ allRequestResponses: [entry(parsed)], [HTTP_RESPONSE_BODY_HINT]: 'raw' }) as Record<string, any>

    expect(object.body).toBe(parsed)
  })

  describe('compactHttpResponse pass-through', () => {
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

  describe('expandHttpResponse pass-through', () => {
    const full = response({ id: 123 }, [entry({ id: 123 })])
    const inputs: [string, unknown][] = [
      ['an uncompacted full response', full],
      ['a non-response object', { foo: 'bar' }],
      ['null', null],
      ['undefined', undefined],
      ['an unknown hint', { [HTTP_RESPONSE_BODY_HINT]: 'other', allRequestResponses: [entry('x')] }],
      ['a hint without `allRequestResponses`', { [HTTP_RESPONSE_BODY_HINT]: 'raw' }],
      ['a `json` hint over a non-string raw value', { [HTTP_RESPONSE_BODY_HINT]: 'json', allRequestResponses: [entry({ a: 1 })] }],
    ]

    for (const [name, input] of inputs) {
      it(`returns ${name} unchanged`, () => {
        expect(expandHttpResponse(input)).toBe(input)
      })
    }
  })
})
