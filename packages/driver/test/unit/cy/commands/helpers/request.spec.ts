/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { HTTP_RESPONSE_BODY_HINT } from '@packages/types'
import { expandHttpResponse } from '../../../../../src/cy/commands/helpers/request'

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

// Mirrors the key order `normalizeResponse` and `sendPromise` produce in the server
const response = (body: unknown, allRequestResponses: Record<string, unknown>[], extra: Record<string, unknown> = {}) => {
  return {
    body,
    headers: { 'content-type': 'application/json' },
    status: 200,
    statusText: 'OK',
    isOkStatusCode: true,
    requestHeaders: { accept: '*/*' },
    duration: 12,
    allRequestResponses,
    ...extra,
  }
}

// What the server sends: the response without `body`, plus the hint
const compacted = (full: Record<string, unknown>, hint: string) => {
  const { body, ...rest } = full

  return { ...rest, [HTTP_RESPONSE_BODY_HINT]: hint }
}

const isArrayBuffer = (value: unknown) => Object.prototype.toString.call(value) === '[object ArrayBuffer]'

describe('cy/commands/helpers/request', () => {
  describe('expandHttpResponse', () => {
    const cases: { name: string, full: () => Record<string, any>, hint: string }[] = [
      {
        name: 'JSON that parses',
        full: () => response({ a: 1, b: [1.5, 'x'] }, [entry('{ "a": 1.0, "b": [1.50, "x"] }')]),
        hint: 'json',
      },
      {
        name: 'JSON whose value is a string',
        full: () => response('hello', [entry('"hello"')]),
        hint: 'json',
      },
      {
        name: 'JSON whose value is null',
        full: () => response(null, [entry('null')]),
        hint: 'json',
      },
      {
        name: 'JSON content type that fails to parse',
        full: () => response('{ not json', [entry('{ not json')]),
        hint: 'raw',
      },
      {
        name: 'non-JSON text',
        full: () => response('<html>hi</html>', [entry('<html>hi</html>', { 'Response Headers': { 'content-type': 'text/html' } })]),
        hint: 'raw',
      },
      {
        name: 'empty body',
        full: () => response('', [entry('')]),
        hint: 'raw',
      },
      {
        name: 'null body',
        full: () => response(null, [entry(null)]),
        hint: 'raw',
      },
      {
        name: 'object already parsed by `json: true`',
        full: () => {
          const raw = { already: 'parsed' }

          return response(raw, [entry(raw)])
        },
        hint: 'raw',
      },
      {
        name: 'redirect chain, where only the final entry holds the body',
        full: () => {
          return response({ final: true }, [
            entry(null, { 'Response Status': 302 }),
            entry('{"final":true}'),
          ], { redirects: ['302: http://localhost:1234/next'] })
        },
        hint: 'json',
      },
      {
        name: '`followRedirect: false` on a 3xx',
        full: () => response('Found', [entry('Found', { 'Response Status': 302 })], { status: 302, redirectedToUrl: 'http://localhost:1234/next' }),
        hint: 'raw',
      },
    ]

    for (const { name, full, hint } of cases) {
      it(`rebuilds ${name} exactly, key order included`, () => {
        const original = full()
        const expanded = expandHttpResponse(compacted(original, hint))

        expect(expanded).toStrictEqual(original)
        expect(Object.keys(expanded)).toEqual(Object.keys(original))
      })
    }

    // These match how an uncompacted response reaches the browser: the socket
    // serializer copies each binary value but keeps other shared references
    it('gives a binary body its own copy of the bytes', () => {
      const raw = new Uint8Array([120, 42, 7]).buffer
      const expanded: any = expandHttpResponse(compacted(response(raw, [entry(raw)]), 'raw'))

      expect(isArrayBuffer(expanded.body)).toBe(true)
      expect(expanded.body).not.toBe(raw)
      expect([...new Uint8Array(expanded.body)]).toEqual([120, 42, 7])
    })

    it('shares an object body with the logged one', () => {
      const raw = { nested: { a: 1 } }
      const expanded: any = expandHttpResponse(compacted(response(raw, [entry(raw)]), 'raw'))

      expect(expanded.body).toBe(raw)
    })

    describe('pass-through', () => {
      const inputs: [string, unknown][] = [
        ['an uncompacted full response', response({ id: 123 }, [entry({ id: 123 })])],
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
})
