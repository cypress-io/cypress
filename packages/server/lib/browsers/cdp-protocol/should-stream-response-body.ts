import type { Protocol } from 'devtools-protocol'

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

// Mirrors resContentTypeIsJavaScript in
// packages/proxy/lib/http/util/document-preparation.ts, including its
// substring-against-the-raw-value semantics.
const JAVASCRIPT_CONTENT_TYPES = ['application/javascript', 'application/x-javascript', 'text/javascript']

const CONTENT_LENGTH_RE = /^\d+$/

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

// Mirrors reqWillRenderHtml in packages/proxy/lib/http/util/document-preparation.ts,
// but content-type containing html is checked as its own standalone signal
// first: an html content-type is injectable regardless of what the request's
// Accept header says, whereas the fallback (no content-type at all) still
// needs the Accept-based heuristic reqWillRenderHtml uses for navigations.
// A never-ending text/html stream (chunked-HTML comet) therefore still
// materializes and can wedge — injection correctness knowingly outranks
// hang-avoidance for html, bounded by the transport's pause timeout.
const willRenderHtml = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined): boolean => {
  if (contentType) {
    return contentType.includes('html')
  }

  const requestHeaders = event.request.headers

  if (getRequestHeader(requestHeaders, 'x-requested-with')) {
    return false
  }

  const accept = getRequestHeader(requestHeaders, 'accept')

  return !!accept && accept.includes('text/html') && accept.includes('application/xhtml+xml')
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

  return !!contentType && JAVASCRIPT_CONTENT_TYPES.some((type) => contentType.includes(type))
}

// MaybeInjectServiceWorker (packages/proxy/lib/http/response-middleware.ts)
// prepends script text into the service worker body even when it's empty.
// Deliberately broader than the proxy's hasServiceWorkerHeader (which checks
// two exact name casings): any casing counts, and a wasted materialize is
// the safe direction.
const isServiceWorkerScriptRequest = (event: Protocol.Fetch.RequestPausedEvent): boolean => {
  const value = getRequestHeader(event.request.headers, 'service-worker')

  return value?.toLowerCase() === 'script'
}

// A malformed content-length proves nothing about the body's length, so it
// must not count as finite — falling through lets a later rule (or the
// stream default) decide instead. A parseable content-length is the only
// proof of boundedness we accept; bodiless statuses and redirects stream
// harmlessly — their skip marker is unread because MaybeEndWithEmptyBody and
// MaybeSendRedirectToClient end the middleware chain before the capture
// stage.
const isProvablyFinite = (event: Protocol.Fetch.RequestPausedEvent): boolean => {
  const value = getResponseHeader(event.responseHeaders, 'content-length')

  if (value === undefined) {
    return false
  }

  return CONTENT_LENGTH_RE.test(value.trim())
}

// Middleware that reads or writes into even an empty body must see the real
// one: HTML injection, obstructive-code rewriting, service-worker injection,
// and cy.intercept route handlers all break silently on the empty stand-in
// the stream path hands them.
const bodyIsNeeded = (event: Protocol.Fetch.RequestPausedEvent, contentType: string | undefined, options: ShouldStreamResponseBodyOptions): boolean => {
  return isInjectionEligible(event, contentType) ||
    isJsRewriteEligible(contentType, options) ||
    isServiceWorkerScriptRequest(event) ||
    !!options.hasMatchingRoute?.(event)
}

export const shouldStreamResponseBody = (event: Protocol.Fetch.RequestPausedEvent, options: ShouldStreamResponseBodyOptions = {}): boolean => {
  // Raw lowercased value, matched by substring throughout — parameters
  // (charset), newline-folded duplicates, and multi-value joins all survive.
  const contentType = getResponseHeader(event.responseHeaders, 'content-type')?.toLowerCase()

  // Provably endless beats everything, including a content-length and a
  // matched route — materializing hangs getResponseBody (#34470), and a stub
  // still works via the empty-body digest→fulfill path (#34593).
  if (isStreamShaped(event, contentType)) {
    return true
  }

  if (bodyIsNeeded(event, contentType, options)) {
    return false
  }

  return !isProvablyFinite(event)
}
