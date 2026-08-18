const { expect } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { shouldStreamResponseBody, type ShouldStreamResponseBodyOptions } from '../../../lib/browsers/cdp-protocol/should-stream-response-body'

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

type Case = [string, EventOverrides, ShouldStreamResponseBodyOptions | undefined, boolean]

// Runs one shouldStreamResponseBody(createEvent(overrides), options) assertion
// per entry — each row is a single-expect `it` from before, just data instead
// of a duplicated function body.
function runCases (cases: Case[]) {
  for (const [description, overrides, options, expected] of cases) {
    it(description, () => {
      expect(shouldStreamResponseBody(createEvent(overrides), options)).to.equal(expected)
    })
  }
}

describe('shouldStreamResponseBody', () => {
  // migrated from shouldSkipResponseBody — the deny-list shapes still resolve
  // to the never-ending-body path, now spelled 'stream' instead of `true`
  describe('provably stream-shaped', () => {
    runCases([
      ['streams an EventSource resourceType with no content-type header', { resourceType: 'EventSource' }, undefined, true],
      ['streams a plain text/event-stream content-type', { responseHeaders: contentType('text/event-stream') }, undefined, true],
      ['streams text/event-stream with a charset parameter', { responseHeaders: contentType('text/event-stream;charset=utf-8') }, undefined, true],
      ['matches the content-type header name and value case-insensitively', { responseHeaders: [{ name: 'Content-Type', value: 'Text/Event-Stream' }] }, undefined, true],
      ['streams multipart/x-mixed-replace', { responseHeaders: contentType('multipart/x-mixed-replace') }, undefined, true],
      ['beats a content-length that would otherwise prove the body finite', { responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }, { name: 'content-length', value: '10' }] }, undefined, true],
      ['beats a matched cy.intercept route', { responseHeaders: contentType('text/event-stream') }, { hasMatchingRoute: () => true }, true],
      // the highest-stakes precedence: a Document would otherwise materialize
      // for injection, which hangs getResponseBody on a never-ending stream
      ['beats injection eligibility on a Document resourceType', { resourceType: 'Document', responseHeaders: contentType('text/event-stream') }, undefined, true],
      // CDP folds duplicate headers into one newline-separated value; an exact
      // type match could miss it, and on a Document the response would fall to
      // the injection rule and materialize — the Document pairing is what makes
      // this test able to fail
      ['survives a newline-folded duplicate content-type value on a Document', { resourceType: 'Document', responseHeaders: contentType('text/event-stream\ntext/event-stream') }, undefined, true],
    ])
  })

  // migrated: a materialize verdict (formerly "does not skip") for a
  // Document/html response
  describe('injection-eligible', () => {
    runCases([
      ['materializes text/html on a Document resourceType', { resourceType: 'Document', responseHeaders: contentType('text/html') }, undefined, false],
      ['materializes any resourceType with an html-containing content-type', { resourceType: 'Fetch', responseHeaders: contentType('application/xhtml+xml') }, undefined, false],
      ['materializes a bare Document resourceType with no content-type', { resourceType: 'Document' }, undefined, false],
      ['materializes when x-cypress-file-server-error is present', { responseHeaders: [{ name: 'x-cypress-file-server-error', value: 'true' }] }, undefined, false],
    ])

    describe('reqWillRenderHtml fallback (no content-type)', () => {
      runCases([
        ['materializes when accept has both html mimetypes and no x-requested-with', { requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' } }, undefined, false],
        ['streams when accept is missing application/xhtml+xml', { requestHeaders: { accept: 'text/html,*/*' } }, undefined, true],
        ['streams when accept is missing text/html', { requestHeaders: { accept: 'application/xhtml+xml,*/*' } }, undefined, true],
        ['streams when x-requested-with defeats an otherwise-matching accept header', { requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*', 'x-requested-with': 'XMLHttpRequest' } }, undefined, true],
        ['matches accept and x-requested-with header names case-insensitively', { requestHeaders: { Accept: 'text/html,application/xhtml+xml,*/*', 'X-Requested-With': 'XMLHttpRequest' } }, undefined, true],
      ])
    })

    it('a non-html content-type suppresses the accept-header fallback (content-type wins)', () => {
      expect(shouldStreamResponseBody(createEvent({
        responseHeaders: contentType('application/json'),
        requestHeaders: { accept: 'text/html,application/xhtml+xml,*/*' },
      }))).to.equal(true)
    })
  })

  describe('JS-rewrite-eligible', () => {
    const cases: Case[] = []

    for (const jsContentType of ['application/javascript', 'application/x-javascript', 'text/javascript']) {
      cases.push(
        [`streams ${jsContentType} when both rewrite flags are off`, { responseHeaders: contentType(jsContentType) }, { modifyObstructiveCode: false, experimentalModifyObstructiveThirdPartyCode: false }, true],
        [`materializes ${jsContentType} when modifyObstructiveCode is on`, { responseHeaders: contentType(jsContentType) }, { modifyObstructiveCode: true }, false],
        [`materializes ${jsContentType} when experimentalModifyObstructiveThirdPartyCode is on`, { responseHeaders: contentType(jsContentType) }, { experimentalModifyObstructiveThirdPartyCode: true }, false],
      )
    }

    cases.push(
      ['streams a non-javascript content-type even with both flags on', { responseHeaders: contentType('application/json') }, { modifyObstructiveCode: true, experimentalModifyObstructiveThirdPartyCode: true }, true],
      // the overwhelmingly common real-world shape
      ['materializes a javascript content-type with a charset parameter', { responseHeaders: contentType('application/javascript; charset=utf-8') }, { modifyObstructiveCode: true }, false],
    )

    runCases(cases)
  })

  describe('service-worker script request', () => {
    runCases([
      ['materializes when the service-worker request header is "script"', { requestHeaders: { 'service-worker': 'script' } }, undefined, false],
      ['matches the service-worker header name case-insensitively', { requestHeaders: { 'Service-Worker': 'script' } }, undefined, false],
      ['streams when the service-worker header has a different value', { requestHeaders: { 'service-worker': 'navigate' } }, undefined, true],
      ['matches the service-worker header value case-insensitively', { requestHeaders: { 'service-worker': 'Script' } }, undefined, false],
    ])
  })

  describe('matched cy.intercept route', () => {
    runCases([
      ['materializes when hasMatchingRoute returns true', {}, { hasMatchingRoute: () => true }, false],
      ['streams when hasMatchingRoute returns false', {}, { hasMatchingRoute: () => false }, true],
      ['streams when hasMatchingRoute is not provided', {}, undefined, true],
    ])
  })

  describe('provably finite (content-length)', () => {
    const cases: Case[] = [
      ['materializes content-length: 0', { responseHeaders: [{ name: 'content-length', value: '0' }] }, undefined, false],
      ['materializes a content-length with surrounding whitespace', { responseHeaders: [{ name: 'content-length', value: '  123 ' }] }, undefined, false],
    ]

    for (const malformed of ['abc', '-5', '1e3']) {
      cases.push([`treats "${malformed}" as not finite and falls through`, { responseHeaders: [{ name: 'content-length', value: malformed }] }, undefined, true])
    }

    cases.push(
      ['uses the first of multiple content-length headers', { responseHeaders: [{ name: 'content-length', value: 'abc' }, { name: 'content-length', value: '123' }] }, undefined, true],
    )

    runCases(cases)
  })

  describe('never has a body', () => {
    const cases: Case[] = [
      ['materializes a HEAD request', { method: 'HEAD' }, undefined, false],
      ['matches HEAD case-insensitively', { method: 'head' }, undefined, false],
    ]

    for (const status of [100, 101, 199, 204, 304]) {
      cases.push([`materializes status ${status}`, { responseStatusCode: status }, undefined, false])
    }

    cases.push(['streams an ordinary 200', { responseStatusCode: 200 }, undefined, true])

    runCases(cases)
  })

  describe('redirect pause', () => {
    const cases: Case[] = []

    for (const status of [301, 302, 303, 307, 308]) {
      cases.push([`materializes ${status} with a location header`, { responseStatusCode: status, responseHeaders: [{ name: 'location', value: 'https://example.test/next' }] }, undefined, false])
    }

    cases.push(
      ['streams a redirect status with no location header', { responseStatusCode: 302 }, undefined, true],
      // HTTP/1.1 origins usually send `Location:`, and CDP preserves casing
      ['matches a capitalized Location header', { responseStatusCode: 302, responseHeaders: [{ name: 'Location', value: 'https://example.test/next' }] }, undefined, false],
    )

    runCases(cases)
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
