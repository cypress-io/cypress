import _ from 'lodash'
import { PassThrough, Readable } from 'stream'
import { URL } from 'url'
import zlib from 'zlib'
import { InterceptResponse } from '@packages/net-stubbing'
import { concatStream, httpUtils } from '@packages/network'
import { telemetry } from '@packages/telemetry'
import { hasServiceWorkerHeader, isVerboseTelemetry as isVerbose } from '.'

import type { CookieOptions } from 'express'
import type { CypressOutgoingResponse } from '../types'
import type { HttpMiddleware } from '.'
import type { IncomingMessage } from 'http'

import { cspHeaderNames, generateCspDirectives, parseCspHeaders, problematicCspDirectives, unsupportedCSPDirectives } from './util/csp-header'
import { injectIntoServiceWorker } from './util/service-worker-injector'
import { validateHeaderName, validateHeaderValue } from 'http'
import error from '@packages/errors'

interface ResponseMiddlewareProps {
  /**
   * Before using `res.incomingResStream`, `prepareResStream` can be used
   * to remove any encoding that prevents it from being returned as plain text.
   *
   * This is done as-needed to avoid unnecessary g(un)zipping.
   */
  makeResStreamPlainText: () => void
  isGunzipped: boolean
  isBrotliDecompressed: boolean
  /**
   * Original content-encoding order (first = innermost). Used to re-compress in the
   * same order when multiple encodings (e.g. gzip, br) were present.
   */
  contentEncodingOrder: SupportedContentEncoding[]
  /**
   * Set in OmitProblematicHeaders when the origin response declared `Content-Length: 0`,
   * before that header is stripped. Consumed by MaybeEndWithEmptyBody so the proxy can
   * re-emit `Content-Length: 0` instead of letting Node's HTTP layer fall back to
   * `Transfer-Encoding: chunked` for an empty body. See cypress-io/cypress#16469.
   */
  incomingResHadEmptyBody: boolean
  incomingRes: IncomingMessage
  incomingResStream: Readable
}

export type ResponseMiddleware = HttpMiddleware<ResponseMiddlewareProps>

// do not use a debug namespace in this file - use the per-request `this.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

// https://github.com/cypress-io/cypress/issues/1756
const zlibGzipDecompressOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
}

const zlibGzipCompressOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  // Compression must use Z_FINISH so the gzip trailer (CRC + size) is written; otherwise
  // gunzip fails with "unexpected end of file" when decoding layered encoding (e.g. gzip, br).
  finishFlush: zlib.constants.Z_FINISH,
  level: zlib.constants.Z_BEST_SPEED,
}

// Brotli decompression: use BROTLI_OPERATION_FLUSH for lenient decompression of truncated or
// slightly invalid brotli from upstream (same rationale as zlibGzipDecompressOptions for createGunzip).
const zlibBrotliDecompressOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
}

const zlibBrotliCompressOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FINISH,
  params: {
    // Brotli default quality is 11 (slowest). Use quality 1 for fast re-compression in the proxy.
    [zlib.constants.BROTLI_PARAM_QUALITY]: 1,
  },
}

const SUPPORTED_CONTENT_ENCODINGS = ['gzip', 'br'] as const

type SupportedContentEncoding = typeof SUPPORTED_CONTENT_ENCODINGS[number]

/**
 * Returns the content-encoding list in application order (first = applied first = innermost).
 * Only includes encodings we support (gzip, br). Used so we decompress in reverse order
 * and re-compress in the same order, preserving layered encoding semantics per RFC 7230.
 */
function getOrderedContentEncodings (res: IncomingMessage): SupportedContentEncoding[] {
  const raw = (res.headers['content-encoding'] || '').toLowerCase()

  if (!raw) return []

  const order: SupportedContentEncoding[] = []

  for (const part of raw.split(',')) {
    const enc = part.trim()

    if ((enc === 'gzip' || enc === 'br') && !order.includes(enc)) {
      order.push(enc)
    }
  }

  return order
}

function setCookie (res: CypressOutgoingResponse, k: string, v: string, domain: string) {
  let opts: CookieOptions = { domain }

  if (!v) {
    v = ''

    opts.expires = new Date(0)
  }

  return res.cookie(k, v, opts)
}

function setInitialCookie (res: CypressOutgoingResponse, remoteState: any, value) {
  // dont modify any cookies if we're trying to clear the initial cookie and we're not injecting anything
  // dont set the cookies if we're not on the initial request
  if ((!value && !res.wantsInjection) || !res.isInitial) {
    return
  }

  return setCookie(res, '__cypress.initial', value, remoteState.domainName)
}

// The `__cypress.unload` cookie is set browser-side on the runner's
// `beforeunload` so the proxy can redirect a navigation back to the client
// route if the primary app is navigated away from directly. It is meant to be
// cleared on the corresponding `unload`/`pagehide` event, but that event is
// unreliable (especially `unload` in Firefox), so under load the cookie can
// linger past a super-domain reload. A stale flag then causes
// `RedirectToClientRouteIfUnloaded` to bounce a later primary-origin
// navigation (e.g. a cy.origin login redirect) to the client route, leaving
// the AUT stranded and failing the test.
//
// Whenever we serve an injected app document the primary app is loading -
// definitively NOT in the "navigated away" state the flag exists to recover
// from - so the flag is stale and is expired here. The genuine
// "navigated away" recovery is a redirect handled in the request middleware and
// never reaches response injection, so clearing here cannot undermine it.
function clearUnloadCookie (res: CypressOutgoingResponse, remoteState: any) {
  if (!res.wantsInjection) {
    return
  }

  return setCookie(res, '__cypress.unload', '', remoteState.domainName)
}

// "autoplay *; document-domain 'none'" => { autoplay: "*", "document-domain": "'none'" }
const parseFeaturePolicy = (policy: string): any => {
  const pairs = policy.split('; ').map((directive) => directive.split(' '))

  return _.fromPairs(pairs)
}

// { autoplay: "*", "document-domain": "'none'" } => "autoplay *; document-domain 'none'"
const stringifyFeaturePolicy = (policy: any): string => {
  const pairs = _.toPairs(policy)

  return pairs.map((directive) => directive.join(' ')).join('; ')
}

const LogResponse: ResponseMiddleware = function () {
  this.debug('received response %o', {
    browserPreRequest: _.pick(this.req.browserPreRequest, 'requestId'),
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
    incomingRes: _.pick(this.incomingRes, 'headers', 'statusCode'),
  })

  this.next()
}

const FilterNonProxiedResponse: ResponseMiddleware = function () {
  // if the request is from an extra target (i.e. not the main Cypress tab, but
  // an extra tab/window), we want to skip any manipulation of the response and
  // only run the middleware necessary to get it back to the browser
  if (this.req.isFromExtraTarget) {
    this.debug('response for [%s %s] is from extra target', this.req.method, this.req.proxiedUrl)

    // this is normally done in the OmitProblematicHeaders middleware, but we
    // don't want to omit any headers in this case
    this.res.set(this.incomingRes.headers)

    this.onlyRunMiddleware([
      'AttachPlainTextStreamFn',
      'PatchExpressSetHeader',
      'MaybeSendRedirectToClient',
      'CopyResponseStatusCode',
      'MaybeEndWithEmptyBody',
      'CompressBody',
      'SendResponseBodyToClient',
    ])
  }

  this.next()
}

const AttachPlainTextStreamFn: ResponseMiddleware = function () {
  this.makeResStreamPlainText = function () {
    const span = telemetry.startSpan({ name: 'make:res:stream:plain:text', parentSpan: this.resMiddlewareSpan, isVerbose })

    this.debug('ensuring resStream is plaintext')

    // RFC 7230: content-encoding lists encodings in application order (first = innermost).
    // Decompress in reverse order (outermost first) so we respect layered encoding.
    const order = getOrderedContentEncodings(this.incomingRes)

    this.contentEncodingOrder = order

    span?.setAttributes({
      isResGunzupped: order.includes('gzip'),
      isResBrotli: order.includes('br'),
    })

    // Decompress outermost first: reverse order (e.g. "gzip, br" → un-br then un-gzip).
    for (let i = order.length - 1; i >= 0; i--) {
      const enc = order[i]

      if (enc === 'gzip' && !this.isGunzipped) {
        this.debug('gunzipping response body')

        const gunzip = zlib.createGunzip(zlibGzipDecompressOptions)

        this.incomingResStream = this.incomingResStream.pipe(gunzip).on('error', this.onError)

        this.isGunzipped = true
      } else if (enc === 'br' && !this.isBrotliDecompressed) {
        this.debug('decompressing Brotli response body')

        const brotliDecompress = zlib.createBrotliDecompress(zlibBrotliDecompressOptions)

        this.incomingResStream = this.incomingResStream.pipe(brotliDecompress).on('error', this.onError)

        this.isBrotliDecompressed = true
      }
    }

    span?.end()
  }

  this.next()
}

const PatchExpressSetHeader: ResponseMiddleware = function () {
  const { incomingRes } = this
  const originalSetHeader = this.res.setHeader

  // Node uses their own Symbol object, so use this to get the internal kOutHeaders
  // symbol - Symbol.for('kOutHeaders') will not work
  const getKOutHeadersSymbol = () => {
    const findKOutHeadersSymbol = (): symbol => {
      return _.find(Object.getOwnPropertySymbols(this.res), (sym) => {
        return sym.toString() === 'Symbol(kOutHeaders)'
      })!
    }

    let sym = findKOutHeadersSymbol()

    if (sym) {
      return sym
    }

    // force creation of a new header field so the kOutHeaders key is available
    this.res.setHeader('X-Cypress-HTTP-Response', 'X')
    this.res.removeHeader('X-Cypress-HTTP-Response')

    sym = findKOutHeadersSymbol()

    if (!sym) {
      throw new Error('unable to find kOutHeaders symbol')
    }

    return sym
  }

  let kOutHeaders

  const ctxDebug = this.debug

  // @ts-expect-error
  this.res.setHeader = function (name, value) {
    // express.Response.setHeader does all kinds of silly/nasty stuff to the content-type...
    // but we don't want to change it at all!
    if (name === 'content-type') {
      value = incomingRes.headers['content-type'] || value
    }

    // run the original function - if an "invalid header char" error is raised,
    // set the header manually. this way we can retain Node's original error behavior
    try {
      return originalSetHeader.call(this, name, value)
    } catch (err: any) {
      if (err.code !== 'ERR_INVALID_CHAR') {
        throw err
      }

      ctxDebug('setHeader error ignored %o', { name, value, code: err.code, err })

      if (!kOutHeaders) {
        kOutHeaders = getKOutHeadersSymbol()
      }

      // https://github.com/nodejs/node/blob/42cce5a9d0fd905bf4ad7a2528c36572dfb8b5ad/lib/_http_outgoing.js#L483-L495
      let headers = this[kOutHeaders]

      if (!headers) {
        this[kOutHeaders] = headers = Object.create(null)
      }

      headers[name.toLowerCase()] = [name, value]
    }
  }

  this.next()
}

const OmitProblematicHeaders: ResponseMiddleware = function () {
  const span = telemetry.startSpan({ name: 'omit:problematic:header', parentSpan: this.resMiddlewareSpan, isVerbose })

  this.incomingResHadEmptyBody = this.incomingRes.headers['content-length'] === '0'

  const headers = _.omit(this.incomingRes.headers, [
    'set-cookie',
    'x-frame-options',
    'content-length',
    'transfer-encoding',
    'connection',
  ])

  this.debug('The headers are %o', headers)

  // Filter for invalid headers
  const filteredHeaders = Object.fromEntries(
    Object.entries(headers).filter(([key, value]) => {
      try {
        validateHeaderName(key)
        if (Array.isArray(value)) {
          value.forEach((v) => validateHeaderValue(key, v))
        } else if (value !== undefined) {
          validateHeaderValue(key, value)
        } else {
          error.warning('PROXY_ENCOUNTERED_INVALID_HEADER_VALUE', { [key]: value }, this.req.method, this.req.originalUrl, new TypeError('Header value is undefined while expecting string'))

          return false
        }

        return true
      } catch (err) {
        if (err.code === 'ERR_INVALID_HTTP_TOKEN') {
          error.warning('PROXY_ENCOUNTERED_INVALID_HEADER_NAME', { [key]: value }, this.req.method, this.req.originalUrl, err)
        } else if (err.code === 'ERR_INVALID_CHAR') {
          error.warning('PROXY_ENCOUNTERED_INVALID_HEADER_VALUE', { [key]: value }, this.req.method, this.req.originalUrl, err)
        } else {
          // rethrow any other errors
          throw err
        }

        return false
      }
    }),
  )

  this.res.set(filteredHeaders)

  this.debug('the new response headers are %o', this.res.getHeaderNames())

  span?.setAttributes({
    experimentalCspAllowList: this.config.experimentalCspAllowList,
  })

  if (this.config.experimentalCspAllowList) {
    const allowedDirectives = this.config.experimentalCspAllowList === true ? [] : this.config.experimentalCspAllowList as Cypress.experimentalCspAllowedDirectives[]

    // If the user has specified CSP directives to allow, we must not remove them from the CSP headers
    const stripDirectives = [...unsupportedCSPDirectives, ...problematicCspDirectives.filter((directive) => !allowedDirectives.includes(directive))]

    // Iterate through each CSP header
    cspHeaderNames.forEach((headerName) => {
      const modifiedCspHeaders = parseCspHeaders(this.incomingRes.headers, headerName, stripDirectives)
      .map(generateCspDirectives)
      .filter(Boolean)

      if (modifiedCspHeaders.length === 0) {
        // If there are no CSP policies after stripping directives, we will remove it from the response
        // Altering the CSP headers using the native response header methods is case-insensitive
        this.res.removeHeader(headerName)
      } else {
        // To replicate original response CSP headers, we must apply all header values as an array
        this.res.setHeader(headerName, modifiedCspHeaders)
      }
    })
  } else {
    cspHeaderNames.forEach((headerName) => {
      // Altering the CSP headers using the native response header methods is case-insensitive
      this.res.removeHeader(headerName)
    })
  }

  span?.end()

  this.next()
}

const MaybeSetOriginAgentClusterHeader: ResponseMiddleware = function () {
  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT) {
    const origin = new URL(this.req.proxiedUrl).origin

    if (process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS && process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS === origin) {
      // For cypress-in-cypress tests exclusively, we need to bucket all origin-agent-cluster requests
      // from HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS to include Origin-Agent-Cluster=false. This has to do with changed
      // behavior starting in Chrome 119. The new behavior works like the following:
      //    - If the first page from an origin does not set the header,
      //      then no other pages from that origin will be origin-keyed, even if those other pages do set the header.
      //    - If the first page from an origin sets the header and is made origin-keyed,
      //      then all other pages from that origin will be origin-keyed whether they ask for it or not.
      // To work around this, any request that matches the origin of HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS
      // should set the Origin-Agent-Cluster=false header to avoid origin-keyed agent clusters.
      // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin-Agent-Cluster for more details.
      this.res.setHeader('Origin-Agent-Cluster', '?0')
    }
  }

  this.next()
}

const SetInjectionLevel: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.setInjectionLevel(this)
}

// https://github.com/cypress-io/cypress/issues/6480
const MaybeStripDocumentDomainFeaturePolicy: ResponseMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:strip:document:domain:feature:policy', parentSpan: this.resMiddlewareSpan, isVerbose })

  const { 'feature-policy': featurePolicy } = this.incomingRes.headers

  if (featurePolicy) {
    const directives = parseFeaturePolicy(<string>featurePolicy)

    if (directives['document-domain']) {
      delete directives['document-domain']

      const policy = stringifyFeaturePolicy(directives)

      span?.setAttributes({
        isFeaturePolicy: !!policy,
      })

      if (policy) {
        this.res.set('feature-policy', policy)
      } else {
        this.res.removeHeader('feature-policy')
      }
    }
  }

  span?.end()
  this.next()
}

const MaybePreventCaching: ResponseMiddleware = function () {
  // do not cache injected responses
  // TODO: consider implementing etag system so even injected content can be cached
  if (this.res.wantsInjection) {
    this.res.setHeader('cache-control', 'no-cache, no-store, must-revalidate')
  }

  this.next()
}

const MaybeCopyCookiesFromIncomingRes: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.copyCookiesFromResponse(this)
}

const REDIRECT_STATUS_CODES: any[] = [301, 302, 303, 307, 308]

// TODO: this shouldn't really even be necessary?
const MaybeSendRedirectToClient: ResponseMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:send:redirect:to:client', parentSpan: this.resMiddlewareSpan, isVerbose })

  const { statusCode, headers } = this.incomingRes
  const newUrl = headers['location']

  const isRedirectNeeded = !REDIRECT_STATUS_CODES.includes(statusCode) || !newUrl

  span?.setAttributes({
    isRedirectNeeded,
  })

  if (isRedirectNeeded) {
    span?.end()

    return this.next()
  }

  // If we're redirecting from a request that doesn't expect to have a preRequest (e.g. download links), we need to treat the redirected url as such as well.
  if (this.req.noPreRequestExpected) {
    this.addPendingUrlWithoutPreRequest(newUrl)
  }

  setInitialCookie(this.res, this.remoteStates.current(), true)

  this.debug('redirecting to new url %o', { statusCode, newUrl })
  this.res.redirect(Number(statusCode), newUrl)

  span?.end()

  // TODO; how do we instrument end?
  return this.end()
}

const CopyResponseStatusCode: ResponseMiddleware = function () {
  this.res.status(Number(this.incomingRes.statusCode))
  // Set custom status message/reason phrase from http response
  // https://github.com/cypress-io/cypress/issues/16973
  if (this.incomingRes.statusMessage) {
    this.res.statusMessage = this.incomingRes.statusMessage
  }

  this.next()
}

const ClearCyInitialCookie: ResponseMiddleware = function () {
  setInitialCookie(this.res, this.remoteStates.current(), false)
  clearUnloadCookie(this.res, this.remoteStates.current())
  this.next()
}

const MaybeEndWithEmptyBody: ResponseMiddleware = function () {
  if (httpUtils.responseMustHaveEmptyBody(this.req, this.incomingRes)) {
    this.networkInterceptionCore.notifyResponseEndedWithEmptyBody(this, {
      isCached: this.incomingRes.statusCode === 304,
    })

    this.res.end()

    return this.end()
  }

  // When the origin response declared `Content-Length: 0`, short-circuit with an
  // explicit Content-Length: 0 instead of streaming an empty body — otherwise
  // OmitProblematicHeaders has stripped Content-Length and Node's HTTP layer
  // adds `Transfer-Encoding: chunked`, which breaks clients that assume a
  // response for chunked encoding. See cypress-io/cypress#16469.
  // Skip when downstream middleware will rewrite the body or when a cy.intercept
  // route matched (the interceptor may have replaced the body without updating
  // the upstream Content-Length header).
  const wasIntercepted = !!this.netStubbingState?.requests?.[this.req.requestId]

  if (
    this.incomingResHadEmptyBody
    && !wasIntercepted
    && !this.res.wantsInjection
    && !this.res.wantsSecurityRemoved
  ) {
    this.networkInterceptionCore.notifyResponseEndedWithEmptyBody(this, { isCached: false })
    this.res.setHeader('Content-Length', '0')
    this.res.end()

    return this.end()
  }

  this.next()
}

const MaybeInjectHtml: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.injectHtml(this)
}

const MaybeRemoveSecurity: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.removeSecurity(this)
}

const MaybeInjectServiceWorker: ResponseMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:inject:service:worker', parentSpan: this.resMiddlewareSpan, isVerbose })
  const hasHeader = hasServiceWorkerHeader(this.req.headers)

  span?.setAttributes({ hasServiceWorkerHeader: hasHeader })

  // skip if we don't have the header or we're not in chromium
  if (!hasHeader || this.getCurrentBrowser().family !== 'chromium') {
    span?.end()

    return this.next()
  }

  this.makeResStreamPlainText()

  this.incomingResStream.setEncoding('utf8')

  this.incomingResStream.pipe(concatStream(async (body) => {
    const updatedBody = injectIntoServiceWorker(body)

    const pt = new PassThrough

    pt.write(updatedBody)
    pt.end()

    this.incomingResStream = pt

    this.next()
  })).on('error', this.onError).once('close', () => {
    span?.end()
  })
}

const CompressBody: ResponseMiddleware = async function () {
  await this.networkInterceptionCore.notifyResponseStreamReceived(this)

  // Re-compress in the same order as the original content-encoding (innermost first).
  const order = this.contentEncodingOrder ?? []

  for (const enc of order) {
    if (enc === 'gzip' && this.isGunzipped) {
      this.debug('regzipping response body')

      const span = telemetry.startSpan({ name: 'gzip:body', parentSpan: this.resMiddlewareSpan, isVerbose })

      this.incomingResStream = this.incomingResStream
      .pipe(zlib.createGzip(zlibGzipCompressOptions))
      .on('error', this.onError)
      .once('close', () => {
        span?.end()
      })
    } else if (enc === 'br' && this.isBrotliDecompressed) {
      this.debug('re-compressing Brotli response body')

      const span = telemetry.startSpan({ name: 'brotli:body', parentSpan: this.resMiddlewareSpan, isVerbose })

      this.incomingResStream = this.incomingResStream
      .pipe(zlib.createBrotliCompress(zlibBrotliCompressOptions))
      .on('error', this.onError)
      .once('close', () => {
        span?.end()
      })
    }
  }

  this.next()
}

const SendResponseBodyToClient: ResponseMiddleware = function () {
  if (this.req.isAUTFrame) {
    // track the previous AUT request URL so we know if the next requests
    // is cross-origin
    this.setAUTUrl(this.req.proxiedUrl)
  }

  this.incomingResStream.pipe(this.res).on('error', this.onError)

  this.res.once('finish', () => {
    this.end()
  })
}

export default {
  LogResponse,
  FilterNonProxiedResponse,
  AttachPlainTextStreamFn,
  InterceptResponse,
  PatchExpressSetHeader,
  OmitProblematicHeaders, // Since we might modify CSP headers, this middleware needs to come BEFORE SetInjectionLevel
  MaybeSetOriginAgentClusterHeader, // NOTE: only used in cypress-in-cypress testing. this is otherwise a no-op
  SetInjectionLevel,
  MaybePreventCaching,
  MaybeStripDocumentDomainFeaturePolicy,
  MaybeCopyCookiesFromIncomingRes,
  MaybeSendRedirectToClient,
  CopyResponseStatusCode,
  ClearCyInitialCookie,
  MaybeEndWithEmptyBody,
  MaybeInjectHtml,
  MaybeRemoveSecurity,
  MaybeInjectServiceWorker,
  CompressBody,
  SendResponseBodyToClient,
}
