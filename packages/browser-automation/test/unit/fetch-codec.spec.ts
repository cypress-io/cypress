import { describe, it, expect } from 'vitest'
import { cdpFetch } from '../../lib/cdp/fetch-codec'
import { createFetchPausedEvent, createFetchResponsePausedEvent, FakeCriClient } from '../../lib/testing/fake-cri-client'

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

  describe('toHttpResponse', () => {
    it('maps response-stage pause metadata and decodes base64 bodies', () => {
      const paused = createFetchResponsePausedEvent({
        responseStatusCode: 201,
        responseStatusText: 'Created',
        responseHeaders: [
          { name: 'content-type', value: 'text/plain' },
          { name: 'set-cookie', value: 'a=1' },
          { name: 'set-cookie', value: 'b=2' },
        ],
      })

      const response = cdpFetch.toHttpResponse(paused, Buffer.from('hello').toString('base64'), true)

      expect(response).toEqual({
        statusCode: 201,
        statusMessage: 'Created',
        headers: {
          'content-type': 'text/plain',
          'set-cookie': ['a=1', 'b=2'],
        },
        body: Buffer.from('hello'),
      })
    })

    it('keeps plain string bodies when not base64 encoded', () => {
      const response = cdpFetch.toHttpResponse(createFetchResponsePausedEvent(), 'plain', false)

      expect(response.body).toBe('plain')
    })
  })

  describe('materializeResponse', () => {
    it('reads the body via Fetch.getResponseBody', async () => {
      const client = new FakeCriClient()

      client.setResponseBody('req-1', 'origin-body')

      const response = await cdpFetch.materializeResponse(client, createFetchResponsePausedEvent())

      expect(client.getCommands('Fetch.getResponseBody')).toHaveLength(1)
      expect(response.statusCode).toBe(200)
      expect(response.body).toBe('origin-body')
    })

    it('skips the body read for redirects and tolerates an empty body', async () => {
      const client = new FakeCriClient()

      const response = await cdpFetch.materializeResponse(client, createFetchResponsePausedEvent({
        responseStatusCode: 302,
        responseStatusText: 'Found',
        responseHeaders: [{ name: 'location', value: 'https://example.com/next' }],
      }))

      expect(client.getCommands('Fetch.getResponseBody')).toHaveLength(0)
      expect(response.statusCode).toBe(302)
      expect(response.body).toBe('')
      expect(response.headers).toEqual({ location: 'https://example.com/next' })
    })
  })
})
