const { expect } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { shouldStreamResponseBody } from '../../../lib/browsers/cdp-protocol/should-stream-response-body'

interface EventOverrides {
  resourceType?: Protocol.Network.ResourceType
  method?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
  responseStatusCode?: number
}

// Fills in the request/response shape shouldStreamResponseBody actually reads at
// runtime — the old shouldSkipResponseBody only ever touched resourceType and
// responseHeaders, so its tests could get away with bare literals.
function createEvent (overrides: EventOverrides = {}): Protocol.Fetch.RequestPausedEvent {
  return {
    requestId: 'request-1',
    frameId: 'frame-1',
    resourceType: overrides.resourceType ?? 'Fetch',
    request: {
      url: 'https://example.test/',
      method: overrides.method ?? 'GET',
      headers: overrides.requestHeaders ?? {},
    },
    responseHeaders: overrides.responseHeaders,
    responseStatusCode: overrides.responseStatusCode,
  } as Protocol.Fetch.RequestPausedEvent
}

function contentType (value: string): Protocol.Fetch.HeaderEntry[] {
  return [{ name: 'content-type', value }]
}

describe('shouldStreamResponseBody', () => {
  // migrated from shouldSkipResponseBody — the deny-list shapes still resolve
  // to the never-ending-body path, now spelled 'stream' instead of `true`
  describe('provably stream-shaped', () => {
    it('streams an EventSource resourceType with no content-type header', () => {
      expect(shouldStreamResponseBody(createEvent({ resourceType: 'EventSource' }))).to.equal(true)
    })

    it('streams a plain text/event-stream content-type', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('text/event-stream') }))).to.equal(true)
    })

    it('streams text/event-stream with a charset parameter', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('text/event-stream;charset=utf-8') }))).to.equal(true)
    })

    it('matches the content-type header name and value case-insensitively', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'Content-Type', value: 'Text/Event-Stream' }],
      }))).to.equal(true)
    })

    it('streams multipart/x-mixed-replace', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('multipart/x-mixed-replace') }))).to.equal(true)
    })

    it('beats a content-length that would otherwise prove the body finite', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }, { name: 'content-length', value: '10' }],
      }))).to.equal(true)
    })

    it('beats a matched cy.intercept route', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: contentType('text/event-stream'),
      }), { hasMatchingRoute: () => true })).to.equal(true)
    })

    // the highest-stakes precedence: a Document would otherwise materialize
    // for injection, which hangs getResponseBody on a never-ending stream
    it('beats injection eligibility on a Document resourceType', () => {
      expect(shouldStreamResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/event-stream'),
      }))).to.equal(true)
    })

    // CDP folds duplicate headers into one newline-separated value; an exact
    // type match could miss it, and on a Document the response would fall to
    // the injection rule and materialize — the Document pairing is what makes
    // this test able to fail
    it('survives a newline-folded duplicate content-type value on a Document', () => {
      expect(shouldStreamResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/event-stream\ntext/event-stream'),
      }))).to.equal(true)
    })
  })

  // migrated: a materialize verdict (formerly "does not skip") for a
  // Document/html response
  describe('injection-eligible', () => {
    it('materializes text/html on a Document resourceType', () => {
      expect(shouldStreamResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/html'),
      }))).to.equal(false)
    })

    it('materializes any resourceType with an html-containing content-type', () => {
      expect(shouldStreamResponseBody(createEvent({
        resourceType: 'Fetch',
        responseHeaders: contentType('application/xhtml+xml'),
      }))).to.equal(false)
    })

    it('materializes a bare Document resourceType with no content-type', () => {
      expect(shouldStreamResponseBody(createEvent({ resourceType: 'Document' }))).to.equal(false)
    })

    it('materializes when x-cypress-file-server-error is present', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'x-cypress-file-server-error', value: 'true' }],
      }))).to.equal(false)
    })

    describe('reqWillRenderHtml fallback (no content-type)', () => {
      it('materializes when accept has both html mimetypes and no x-requested-with', () => {
        expect(shouldStreamResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' },
        }))).to.equal(false)
      })

      it('streams when accept is missing application/xhtml+xml', () => {
        expect(shouldStreamResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,*/*' },
        }))).to.equal(true)
      })

      it('streams when accept is missing text/html', () => {
        expect(shouldStreamResponseBody(createEvent({
          requestHeaders: { accept: 'application/xhtml+xml,*/*' },
        }))).to.equal(true)
      })

      it('streams when x-requested-with defeats an otherwise-matching accept header', () => {
        expect(shouldStreamResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*', 'x-requested-with': 'XMLHttpRequest' },
        }))).to.equal(true)
      })

      it('matches accept and x-requested-with header names case-insensitively', () => {
        expect(shouldStreamResponseBody(createEvent({
          requestHeaders: { Accept: 'text/html,application/xhtml+xml,*/*', 'X-Requested-With': 'XMLHttpRequest' },
        }))).to.equal(true)
      })
    })

    it('a non-html content-type suppresses the accept-header fallback (content-type wins)', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: contentType('application/json'),
        requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' },
      }))).to.equal(true)
    })
  })

  describe('JS-rewrite-eligible', () => {
    for (const jsContentType of ['application/javascript', 'application/x-javascript', 'text/javascript']) {
      it(`streams ${jsContentType} when both rewrite flags are off`, () => {
        expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          modifyObstructiveCode: false,
          experimentalModifyObstructiveThirdPartyCode: false,
        })).to.equal(true)
      })

      it(`materializes ${jsContentType} when modifyObstructiveCode is on`, () => {
        expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          modifyObstructiveCode: true,
        })).to.equal(false)
      })

      it(`materializes ${jsContentType} when experimentalModifyObstructiveThirdPartyCode is on`, () => {
        expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          experimentalModifyObstructiveThirdPartyCode: true,
        })).to.equal(false)
      })
    }

    it('streams a non-javascript content-type even with both flags on', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('application/json') }), {
        modifyObstructiveCode: true,
        experimentalModifyObstructiveThirdPartyCode: true,
      })).to.equal(true)
    })

    // the overwhelmingly common real-world shape
    it('materializes a javascript content-type with a charset parameter', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('application/javascript; charset=utf-8') }), {
        modifyObstructiveCode: true,
      })).to.equal(false)
    })
  })

  describe('service-worker script request', () => {
    it('materializes when the service-worker request header is "script"', () => {
      expect(shouldStreamResponseBody(createEvent({ requestHeaders: { 'service-worker': 'script' } }))).to.equal(false)
    })

    it('matches the service-worker header name case-insensitively', () => {
      expect(shouldStreamResponseBody(createEvent({ requestHeaders: { 'Service-Worker': 'script' } }))).to.equal(false)
    })

    it('streams when the service-worker header has a different value', () => {
      expect(shouldStreamResponseBody(createEvent({ requestHeaders: { 'service-worker': 'navigate' } }))).to.equal(true)
    })

    it('matches the service-worker header value case-insensitively', () => {
      expect(shouldStreamResponseBody(createEvent({ requestHeaders: { 'service-worker': 'Script' } }))).to.equal(false)
    })
  })

  describe('matched cy.intercept route', () => {
    it('materializes when hasMatchingRoute returns true', () => {
      expect(shouldStreamResponseBody(createEvent(), { hasMatchingRoute: () => true })).to.equal(false)
    })

    it('streams when hasMatchingRoute returns false', () => {
      expect(shouldStreamResponseBody(createEvent(), { hasMatchingRoute: () => false })).to.equal(true)
    })

    it('streams when hasMatchingRoute is not provided', () => {
      expect(shouldStreamResponseBody(createEvent())).to.equal(true)
    })
  })

  describe('provably finite (content-length)', () => {
    it('materializes content-length: 0', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: '0' }],
      }))).to.equal(false)
    })

    it('materializes a content-length with surrounding whitespace', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: '  123 ' }],
      }))).to.equal(false)
    })

    for (const malformed of ['abc', '-5', '1e3']) {
      it(`treats "${malformed}" as not finite and falls through`, () => {
        expect(shouldStreamResponseBody(createEvent({
          responseHeaders: [{ name: 'content-length', value: malformed }],
        }))).to.equal(true)
      })
    }

    it('uses the first of multiple content-length headers', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: 'abc' }, { name: 'content-length', value: '123' }],
      }))).to.equal(true)
    })
  })

  describe('never has a body', () => {
    it('materializes a HEAD request', () => {
      expect(shouldStreamResponseBody(createEvent({ method: 'HEAD' }))).to.equal(false)
    })

    it('matches HEAD case-insensitively', () => {
      expect(shouldStreamResponseBody(createEvent({ method: 'head' }))).to.equal(false)
    })

    for (const status of [100, 101, 199, 204, 304]) {
      it(`materializes status ${status}`, () => {
        expect(shouldStreamResponseBody(createEvent({ responseStatusCode: status }))).to.equal(false)
      })
    }

    it('streams an ordinary 200', () => {
      expect(shouldStreamResponseBody(createEvent({ responseStatusCode: 200 }))).to.equal(true)
    })
  })

  describe('redirect pause', () => {
    for (const status of [301, 302, 303, 307, 308]) {
      it(`materializes ${status} with a location header`, () => {
        expect(shouldStreamResponseBody(createEvent({
          responseStatusCode: status,
          responseHeaders: [{ name: 'location', value: 'https://example.test/next' }],
        }))).to.equal(false)
      })
    }

    it('streams a redirect status with no location header', () => {
      expect(shouldStreamResponseBody(createEvent({ responseStatusCode: 302 }))).to.equal(true)
    })

    // HTTP/1.1 origins usually send `Location:`, and CDP preserves casing
    it('matches a capitalized Location header', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseStatusCode: 302,
        responseHeaders: [{ name: 'Location', value: 'https://example.test/next' }],
      }))).to.equal(false)
    })
  })

  describe('default options', () => {
    it('behaves as if all flags were off when no options argument is passed', () => {
      expect(shouldStreamResponseBody(createEvent({ responseHeaders: contentType('text/javascript') }))).to.equal(true)
    })
  })

  // the fix this module ships: a chunked JSON/xhr response (long-polling,
  // ndjson) with no content-type match, no content-length, and no matching
  // route now correctly streams instead of hanging getResponseBody (#34623)
  it('streams a plain chunked JSON/xhr shape with no other signal', () => {
    expect(shouldStreamResponseBody(createEvent({
      resourceType: 'XHR',
      responseHeaders: contentType('application/x-ndjson'),
    }))).to.equal(true)
  })
})
