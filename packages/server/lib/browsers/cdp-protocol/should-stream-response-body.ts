import type { Protocol } from 'devtools-protocol'
import { acceptWillRenderHtml, contentTypeIsHtml, contentTypeIsJavaScript } from '@packages/network-interception'

// Decides, at a CDP Fetch Response-stage pause, whether the transport must
// eagerly materialize the body (today's Fetch.getResponseBody) or can take
// the stream path (skip the read; the browser streams the body natively).
//
// A pause missing `networkId` deliberately does not influence classification
// here — that only means the capture pump can't arm for it, which is a
// transport concern. The stream verdict is still correct and hang-free for
// such pauses.

export interface ShouldStreamResponseBodyOptions {
  // config-gated JS rewrite signals, composed from resolved config by network-runtime
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
  // returns true when a cy.intercept route matches this request, composed via matchRoutes
  hasMatchingRoute?: (event: Protocol.Fetch.RequestPausedEvent) => boolean
}

// Fetch.getResponseBody never resolves for a never-ending body (SSE, MJPEG
// multipart streams) — it waits for the response to finish before returning,
// which wedges the pause and the run along with it (#34470). A matched
// cy.intercept route stubbing one of these still works downstream via the
// empty-body digest→fulfill path — that's the shipped behavior in #34593.
// Matched by substring, not exact type: CDP folds duplicate headers into one
// newline-separated value, and this rule is the absolute hang guard — an
// exact match that misses a folded value could let a later rule materialize
// the response and wedge.
const STREAM_CONTENT_TYPES = ['text/event-stream', 'multipart/x-mixed-replace']

const getResponseHeader = (responseHeaders: Protocol.Fetch.HeaderEntry[] | undefined, name: string): string | undefined => {
  return responseHeaders?.find((header) => header.name.toLowerCase() === name)?.value
}

// event.responseHeaders is a HeaderEntry[]; event.request.headers is a plain
// object with arbitrary key casing. Both need case-insensitive lookups.
const getRequestHeader = (headers: Protocol.Network.Headers, name: string): string | undefined => {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name)

  return key === undefined ? undefined : headers[key]
}

// Raw CDP field, not normalizeResourceType's output — that lowercases and
// allowlists, folding EventSource to 'other'.
const isStreamShaped = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined): boolean => {
  if (event.resourceType === 'EventSource') {
    return true
  }

  return !!contentType && STREAM_CONTENT_TYPES.some((type) => contentType.includes(type))
}

// Composes the same two signals as reqWillRenderHtml in
// packages/proxy/lib/http/util/document-preparation.ts, but content-type
// containing html is checked as its own standalone signal first: an html
// content-type is injectable regardless of what the request's Accept header
// says, whereas the fallback (no content-type at all) still needs the
// Accept-based heuristic reqWillRenderHtml uses for navigations. A
// never-ending text/html stream (chunked-HTML comet) therefore still
// materializes and can wedge — injection correctness knowingly outranks
// hang-avoidance for html, bounded by the transport's pause timeout.
const willRenderHtml = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined): boolean => {
  if (contentType) {
    return contentTypeIsHtml(contentType)
  }

  const requestHeaders = event.request.headers

  return acceptWillRenderHtml(
    getRequestHeader(requestHeaders, 'accept'),
    getRequestHeader(requestHeaders, 'x-requested-with'),
  )
}

// The HTML injector (rewriter.ts) writes into even an EMPTY body — it wraps
// the body head-only — so the stream path would replace the origin document
// with an incomplete one instead of leaving it untouched.
const isInjectionEligible = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined): boolean => {
  if (willRenderHtml(event, contentType)) {
    return true
  }

  if (event.resourceType === 'Document') {
    return true
  }

  return getResponseHeader(event.responseHeaders, 'x-cypress-file-server-error') !== undefined
}

// Only relevant when a JS-rewrite flag is on; which of the two flags is set
// doesn't matter here — first- vs third-party scoping happens in the
// middleware, and this rule only needs to know rewriting is possible at all.
const isJsRewriteEligible = (contentType: string | undefined, options: ShouldStreamResponseBodyOptions): boolean => {
  if (!options.modifyObstructiveCode && !options.experimentalModifyObstructiveThirdPartyCode) {
    return false
  }

  return contentTypeIsJavaScript(contentType)
}

// Middleware that reads or writes into even an empty body must see the real
// one: HTML injection, obstructive-code rewriting, and cy.intercept route
// handlers all break silently on the empty stand-in the stream path hands them.
const bodyIsNeeded = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined, options: ShouldStreamResponseBodyOptions): boolean => {
  return isInjectionEligible(event, contentType) ||
    isJsRewriteEligible(contentType, options) ||
    !!options.hasMatchingRoute?.(event)
}

export const shouldStreamResponseBody = (event: Protocol.Fetch.RequestPausedEvent, options: ShouldStreamResponseBodyOptions = {}): boolean => {
  // Raw lowercased value, matched by substring throughout — parameters
  // (charset), newline-folded duplicates, and multi-value joins all survive.
  const contentType = getResponseHeader(event.responseHeaders, 'content-type')?.toLowerCase()

  // A response that never ends always streams, even when a cy.intercept route
  // matches it: reading it would hang (#34470). A route that stubs it still
  // works, because a changed body is sent with Fetch.fulfillRequest (#34593).
  if (isStreamShaped(event, contentType)) {
    return true
  }

  // Reading a body means Fetch.getResponseBody, which returns the whole body
  // as one base64 CDP message. The server has to receive and decode it before
  // it can release the pause, so a large file stalls cy.task and every other
  // request in the meantime.
  return !bodyIsNeeded(event, contentType, options)
}
