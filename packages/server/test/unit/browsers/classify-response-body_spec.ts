const { expect } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { classifyResponseBody } from '../../../lib/browsers/cdp-protocol/classify-response-body'

interface EventOverrides {
  resourceType?: Protocol.Network.ResourceType
  method?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
  responseStatusCode?: number
}

// Fills in the request/response shape classifyResponseBody actually reads at
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

describe('classifyResponseBody', () => {
  // migrated from shouldSkipResponseBody — the deny-list shapes still resolve
  // to the never-ending-body path, now spelled 'stream' instead of `true`
  describe('provably stream-shaped', () => {
    it('streams an EventSource resourceType with no content-type header', () => {
      expect(classifyResponseBody(createEvent({ resourceType: 'EventSource' }))).to.equal('stream')
    })

    it('streams a plain text/event-stream content-type', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('text/event-stream') }))).to.equal('stream')
    })

    it('streams text/event-stream with a charset parameter', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('text/event-stream;charset=utf-8') }))).to.equal('stream')
    })

    it('matches the content-type header name and value case-insensitively', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'Content-Type', value: 'Text/Event-Stream' }],
      }))).to.equal('stream')
    })

    it('streams multipart/x-mixed-replace', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('multipart/x-mixed-replace') }))).to.equal('stream')
    })

    it('beats a content-length that would otherwise prove the body finite', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }, { name: 'content-length', value: '10' }],
      }))).to.equal('stream')
    })

    it('beats a matched cy.intercept route', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: contentType('text/event-stream'),
      }), { hasMatchingRoute: () => true })).to.equal('stream')
    })

    // the highest-stakes precedence: a Document would otherwise materialize
    // for injection, which hangs getResponseBody on a never-ending stream
    it('beats injection eligibility on a Document resourceType', () => {
      expect(classifyResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/event-stream'),
      }))).to.equal('stream')
    })

    // CDP folds duplicate headers into one newline-separated value; an exact
    // type match could miss it, and on a Document the response would fall to
    // the injection rule and materialize — the Document pairing is what makes
    // this test able to fail
    it('survives a newline-folded duplicate content-type value on a Document', () => {
      expect(classifyResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/event-stream\ntext/event-stream'),
      }))).to.equal('stream')
    })
  })

  // migrated: a materialize verdict (formerly "does not skip") for a
  // Document/html response
  describe('injection-eligible', () => {
    it('materializes text/html on a Document resourceType', () => {
      expect(classifyResponseBody(createEvent({
        resourceType: 'Document',
        responseHeaders: contentType('text/html'),
      }))).to.equal('materialize')
    })

    it('materializes any resourceType with an html-containing content-type', () => {
      expect(classifyResponseBody(createEvent({
        resourceType: 'Fetch',
        responseHeaders: contentType('application/xhtml+xml'),
      }))).to.equal('materialize')
    })

    it('materializes a bare Document resourceType with no content-type', () => {
      expect(classifyResponseBody(createEvent({ resourceType: 'Document' }))).to.equal('materialize')
    })

    it('materializes when x-cypress-file-server-error is present', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'x-cypress-file-server-error', value: 'true' }],
      }))).to.equal('materialize')
    })

    describe('reqWillRenderHtml fallback (no content-type)', () => {
      it('materializes when accept has both html mimetypes and no x-requested-with', () => {
        expect(classifyResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' },
        }))).to.equal('materialize')
      })

      it('streams when accept is missing application/xhtml+xml', () => {
        expect(classifyResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,*/*' },
        }))).to.equal('stream')
      })

      it('streams when accept is missing text/html', () => {
        expect(classifyResponseBody(createEvent({
          requestHeaders: { accept: 'application/xhtml+xml,*/*' },
        }))).to.equal('stream')
      })

      it('streams when x-requested-with defeats an otherwise-matching accept header', () => {
        expect(classifyResponseBody(createEvent({
          requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*', 'x-requested-with': 'XMLHttpRequest' },
        }))).to.equal('stream')
      })

      it('matches accept and x-requested-with header names case-insensitively', () => {
        expect(classifyResponseBody(createEvent({
          requestHeaders: { Accept: 'text/html,application/xhtml+xml,*/*', 'X-Requested-With': 'XMLHttpRequest' },
        }))).to.equal('stream')
      })
    })

    it('a non-html content-type suppresses the accept-header fallback (content-type wins)', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: contentType('application/json'),
        requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' },
      }))).to.equal('stream')
    })
  })

  describe('JS-rewrite-eligible', () => {
    for (const jsContentType of ['application/javascript', 'application/x-javascript', 'text/javascript']) {
      it(`streams ${jsContentType} when both rewrite flags are off`, () => {
        expect(classifyResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          modifyObstructiveCode: false,
          experimentalModifyObstructiveThirdPartyCode: false,
        })).to.equal('stream')
      })

      it(`materializes ${jsContentType} when modifyObstructiveCode is on`, () => {
        expect(classifyResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          modifyObstructiveCode: true,
        })).to.equal('materialize')
      })

      it(`materializes ${jsContentType} when experimentalModifyObstructiveThirdPartyCode is on`, () => {
        expect(classifyResponseBody(createEvent({ responseHeaders: contentType(jsContentType) }), {
          experimentalModifyObstructiveThirdPartyCode: true,
        })).to.equal('materialize')
      })
    }

    it('streams a non-javascript content-type even with both flags on', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('application/json') }), {
        modifyObstructiveCode: true,
        experimentalModifyObstructiveThirdPartyCode: true,
      })).to.equal('stream')
    })

    // the overwhelmingly common real-world shape
    it('materializes a javascript content-type with a charset parameter', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('application/javascript; charset=utf-8') }), {
        modifyObstructiveCode: true,
      })).to.equal('materialize')
    })
  })

  describe('service-worker script request', () => {
    it('materializes when the service-worker request header is "script"', () => {
      expect(classifyResponseBody(createEvent({ requestHeaders: { 'service-worker': 'script' } }))).to.equal('materialize')
    })

    it('matches the service-worker header name case-insensitively', () => {
      expect(classifyResponseBody(createEvent({ requestHeaders: { 'Service-Worker': 'script' } }))).to.equal('materialize')
    })

    it('streams when the service-worker header has a different value', () => {
      expect(classifyResponseBody(createEvent({ requestHeaders: { 'service-worker': 'navigate' } }))).to.equal('stream')
    })

    it('matches the service-worker header value case-insensitively', () => {
      expect(classifyResponseBody(createEvent({ requestHeaders: { 'service-worker': 'Script' } }))).to.equal('materialize')
    })
  })

  describe('matched cy.intercept route', () => {
    it('materializes when hasMatchingRoute returns true', () => {
      expect(classifyResponseBody(createEvent(), { hasMatchingRoute: () => true })).to.equal('materialize')
    })

    it('streams when hasMatchingRoute returns false', () => {
      expect(classifyResponseBody(createEvent(), { hasMatchingRoute: () => false })).to.equal('stream')
    })

    it('streams when hasMatchingRoute is not provided', () => {
      expect(classifyResponseBody(createEvent())).to.equal('stream')
    })
  })

  describe('provably finite (content-length)', () => {
    it('materializes content-length: 0', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: '0' }],
      }))).to.equal('materialize')
    })

    it('materializes a content-length with surrounding whitespace', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: '  123 ' }],
      }))).to.equal('materialize')
    })

    for (const malformed of ['abc', '-5', '1e3']) {
      it(`treats "${malformed}" as not finite and falls through`, () => {
        expect(classifyResponseBody(createEvent({
          responseHeaders: [{ name: 'content-length', value: malformed }],
        }))).to.equal('stream')
      })
    }

    it('uses the first of multiple content-length headers', () => {
      expect(classifyResponseBody(createEvent({
        responseHeaders: [{ name: 'content-length', value: 'abc' }, { name: 'content-length', value: '123' }],
      }))).to.equal('stream')
    })
  })

  describe('never has a body', () => {
    it('materializes a HEAD request', () => {
      expect(classifyResponseBody(createEvent({ method: 'HEAD' }))).to.equal('materialize')
    })

    it('matches HEAD case-insensitively', () => {
      expect(classifyResponseBody(createEvent({ method: 'head' }))).to.equal('materialize')
    })

    for (const status of [100, 101, 199, 204, 304]) {
      it(`materializes status ${status}`, () => {
        expect(classifyResponseBody(createEvent({ responseStatusCode: status }))).to.equal('materialize')
      })
    }

    it('streams an ordinary 200', () => {
      expect(classifyResponseBody(createEvent({ responseStatusCode: 200 }))).to.equal('stream')
    })
  })

  describe('redirect pause', () => {
    for (const status of [301, 302, 303, 307, 308]) {
      it(`materializes ${status} with a location header`, () => {
        expect(classifyResponseBody(createEvent({
          responseStatusCode: status,
          responseHeaders: [{ name: 'location', value: 'https://example.test/next' }],
        }))).to.equal('materialize')
      })
    }

    it('streams a redirect status with no location header', () => {
      expect(classifyResponseBody(createEvent({ responseStatusCode: 302 }))).to.equal('stream')
    })

    // HTTP/1.1 origins usually send `Location:`, and CDP preserves casing
    it('matches a capitalized Location header', () => {
      expect(classifyResponseBody(createEvent({
        responseStatusCode: 302,
        responseHeaders: [{ name: 'Location', value: 'https://example.test/next' }],
      }))).to.equal('materialize')
    })
  })

  describe('default options', () => {
    it('behaves as if all flags were off when no options argument is passed', () => {
      expect(classifyResponseBody(createEvent({ responseHeaders: contentType('text/javascript') }))).to.equal('stream')
    })
  })

  // the fix this module ships: a chunked JSON/xhr response (long-polling,
  // ndjson) with no content-type match, no content-length, and no matching
  // route now correctly streams instead of hanging getResponseBody (#34623)
  it('streams a plain chunked JSON/xhr shape with no other signal', () => {
    expect(classifyResponseBody(createEvent({
      resourceType: 'XHR',
      responseHeaders: contentType('application/x-ndjson'),
    }))).to.equal('stream')
  })
})
