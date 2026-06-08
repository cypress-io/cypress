import { describe, it, expect } from 'vitest'
import { cdpFetch } from '../../lib/cdp/fetch-codec'
import { createFetchPausedEvent } from '../../lib/testing/fake-cri-client'

describe('cdpFetch', () => {
  describe('toHttpRequest', () => {
    it('maps Fetch.requestPaused to HttpRequest', () => {
      const paused = createFetchPausedEvent({
        requestId: 'req-abc',
        request: {
          url: 'https://example.com/api',
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          postData: '{"foo":1}',
          initialPriority: 'High',
          referrerPolicy: 'strict-origin-when-cross-origin',
        },
        resourceType: 'Fetch',
      })

      const request = cdpFetch.toHttpRequest(paused)

      expect(request.browserRequestId).toBe('req-abc')
      expect(request.url).toBe('https://example.com/api')
      expect(request.method).toBe('POST')
      expect(request.headers).toEqual({ 'content-type': 'application/json' })
      expect(request.body).toBe('{"foo":1}')
      expect(request.resourceType).toBe('fetch')
      expect(request.inFlightInterceptId).toMatch(/^inFlightIntercept/)
    })
  })

  describe('fromHttpRequest', () => {
    it('maps outbound HttpRequest to Fetch.continueRequest params', () => {
      expect(cdpFetch.fromHttpRequest({
        inFlightInterceptId: 'in-flight-1',
        browserRequestId: 'req-1',
        url: 'https://example.com/',
        method: 'GET',
        headers: { accept: 'text/html' },
      })).toEqual({
        requestId: 'req-1',
        url: 'https://example.com/',
        method: 'GET',
        headers: [{ name: 'accept', value: 'text/html' }],
      })
    })

    it('includes body when present', () => {
      expect(cdpFetch.fromHttpRequest({
        inFlightInterceptId: 'in-flight-1',
        browserRequestId: 'req-1',
        url: 'https://example.com/changed',
        method: 'PUT',
        headers: { 'x-custom': 'yes' },
        body: 'payload',
      })).toEqual({
        requestId: 'req-1',
        url: 'https://example.com/changed',
        method: 'PUT',
        headers: [{ name: 'x-custom', value: 'yes' }],
        postData: 'payload',
      })
    })
  })

  describe('fromHttpResponse', () => {
    it('base64-encodes string and buffer bodies', () => {
      const request = {
        inFlightInterceptId: 'in-flight-1',
        browserRequestId: 'req-1',
        url: 'https://example.com/',
        method: 'GET',
        headers: {},
      }

      const fromString = cdpFetch.fromHttpResponse(request, {
        statusCode: 200,
        statusMessage: 'OK',
        headers: { 'content-type': 'text/plain' },
        body: 'hello',
      })

      expect(fromString).toEqual({
        requestId: 'req-1',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{ name: 'content-type', value: 'text/plain' }],
        body: Buffer.from('hello').toString('base64'),
      })

      const fromBuffer = cdpFetch.fromHttpResponse({ ...request, browserRequestId: 'req-2' }, {
        statusCode: 201,
        headers: { 'set-cookie': ['a=1', 'b=2'] },
        body: Buffer.from('bytes'),
      })

      expect(fromBuffer.body).toBe(Buffer.from('bytes').toString('base64'))
      expect(fromBuffer.responseHeaders).toEqual([
        { name: 'set-cookie', value: 'a=1' },
        { name: 'set-cookie', value: 'b=2' },
      ])
    })
  })
})
