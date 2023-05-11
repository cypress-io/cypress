import charset from 'charset'
import iconv from 'iconv-lite'
import _ from 'lodash'
import { PassThrough, Readable } from 'stream'
import { URL } from 'url'
import zlib from 'zlib'
import { InterceptResponse } from '@packages/net-stubbing'
import { concatStream, cors, httpUtils } from '@packages/network'
import { toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'
import { telemetry } from '@packages/telemetry'
import { CookiesHelper } from './util/cookies'
import * as rewriter from './util/rewriter'
import { doesTopNeedToBeSimulated } from './util/top-simulation'

import type Debug from 'debug'
import type { CookieOptions } from 'express'
import type { CypressIncomingRequest, CypressOutgoingResponse } from '@packages/proxy'
import type { HttpMiddleware, HttpMiddlewareThis } from '.'
import type { IncomingMessage, IncomingHttpHeaders } from 'http'

export interface ResponseMiddlewareProps {
  /**
   * Before using `res.incomingResStream`, `prepareResStream` can be used
   * to remove any encoding that prevents it from being returned as plain text.
   *
   * This is done as-needed to avoid unnecessary g(un)zipping.
   */
  // makeResStreamPlainText: () => void
  isGunzipped: boolean
  incomingRes: IncomingMessage
  incomingResStream: Readable
}

export type ResponseMiddleware = HttpMiddleware<ResponseMiddlewareProps>

// do not use a debug namespace in this file - use the per-request `ctx.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

// https://github.com/cypress-io/cypress/issues/1756
const zlibOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
}

// https://github.com/cypress-io/cypress/issues/1543
function getNodeCharsetFromResponse (headers: IncomingHttpHeaders, body: Buffer, debug: Debug.Debugger) {
  const httpCharset = (charset(headers, body, 1024) || '').toLowerCase()

  debug('inferred charset from response %o', { httpCharset })
  if (iconv.encodingExists(httpCharset)) {
    return httpCharset
  }

  // browsers default to latin1
  return 'latin1'
}

function reqMatchesPolicyBasedOnDomain (req: CypressIncomingRequest, remoteState, skipDomainInjectionForDomains) {
  if (remoteState.strategy === 'http') {
    return cors.urlMatchesPolicyBasedOnDomainProps(req.proxiedUrl, remoteState.props, {
      skipDomainInjectionForDomains,
    })
  }

  if (remoteState.strategy === 'file') {
    return req.proxiedUrl.startsWith(remoteState.origin)
  }

  return false
}

function reqWillRenderHtml (req: CypressIncomingRequest, res: IncomingMessage) {
  // will this request be rendered in the browser, necessitating injection?
  // https://github.com/cypress-io/cypress/issues/288

  // don't inject if this is an XHR from jquery
  if (req.headers['x-requested-with']) {
    return
  }

  // don't inject if we didn't find both text/html and application/xhtml+xml,
  const accept = req.headers['accept']

  // only check the content-type value, if it exists, to contains some type of html mimetype
  const contentType = res?.headers['content-type'] || ''
  const contentTypeIsHtmlIfExists = contentType ? contentType.includes('html') : true

  return accept && accept.includes('text/html') && accept.includes('application/xhtml+xml') && contentTypeIsHtmlIfExists
}

function resContentTypeIs (res: IncomingMessage, contentType: string) {
  return (res.headers['content-type'] || '').includes(contentType)
}

function resContentTypeIsJavaScript (res: IncomingMessage) {
  return _.some(
    ['application/javascript', 'application/x-javascript', 'text/javascript']
    .map(_.partial(resContentTypeIs, res)),
  )
}

function resIsGzipped (res: IncomingMessage) {
  return (res.headers['content-encoding'] || '').includes('gzip')
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

const LogResponse: ResponseMiddleware = (ctx) => {
  ctx.debug('received response %o', {
    browserPreRequest: _.pick(ctx.req.browserPreRequest, 'requestId'),
    req: _.pick(ctx.req, 'method', 'proxiedUrl', 'headers'),
    incomingRes: _.pick(ctx.incomingRes, 'headers', 'statusCode'),
  })

  ctx.next()
}

const makeResStreamPlainText = (ctx) => {
  const span = telemetry.startSpan({
    name: 'make:res:stream:plain:text',
    parentSpan: ctx.resMiddlewareSpan,
  })

  ctx.debug('ensuring resStream is plaintext')

  const isResGunzupped = resIsGzipped(ctx.incomingRes)

  span?.setAttributes({
    isResGunzupped,
  })

  if (ctx.isGunzipped || !isResGunzupped) {
    return
  }

  ctx.isGunzipped = true

  ctx.debug('gunzipping response body')

  const gunzip = zlib.createGunzip(zlibOptions)

  ctx.incomingResStream = ctx.incomingResStream
  .pipe(gunzip)
  .on('error', ctx.onError)
  .once('finish', () => {
    span?.end()
  })

  ctx.next()
}

const PatchExpressSetHeader: ResponseMiddleware = (ctx) => {
  const { incomingRes } = ctx
  const originalSetHeader = ctx.res.setHeader

  // Node uses their own Symbol object, so use this to get the internal kOutHeaders
  // symbol - Symbol.for('kOutHeaders') will not work
  const getKOutHeadersSymbol = () => {
    const findKOutHeadersSymbol = (): symbol => {
      return _.find(Object.getOwnPropertySymbols(ctx.res), (sym) => {
        return sym.toString() === 'Symbol(kOutHeaders)'
      })!
    }

    let sym = findKOutHeadersSymbol()

    if (sym) {
      return sym
    }

    // force creation of a new header field so the kOutHeaders key is available
    ctx.res.setHeader('X-Cypress-HTTP-Response', 'X')
    ctx.res.removeHeader('X-Cypress-HTTP-Response')

    sym = findKOutHeadersSymbol()

    if (!sym) {
      throw new Error('unable to find kOutHeaders symbol')
    }

    return sym
  }

  let kOutHeaders

  const ctxDebug = ctx.debug

  ctx.res.setHeader = function (name, value) {
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

  ctx.next()
}

const SetInjectionLevel: ResponseMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'set:injection:level', parentSpan: ctx.resMiddlewareSpan })

  ctx.res.isInitial = ctx.req.cookies['__cypress.initial'] === 'true'

  const isHTML = resContentTypeIs(ctx.incomingRes, 'text/html')
  const isRenderedHTML = reqWillRenderHtml(ctx.req, ctx.incomingRes)

  if (isRenderedHTML) {
    const origin = new URL(ctx.req.proxiedUrl).origin

    ctx.getRenderedHTMLOrigins()[origin] = true
  }

  ctx.debug('determine injection')

  const isReqMatchSuperDomainOrigin = reqMatchesPolicyBasedOnDomain(ctx.req, ctx.remoteStates.current(), ctx.config.experimentalSkipDomainInjection)

  span?.setAttributes({
    isInitialInjection: ctx.res.isInitial,
    isHTML,
    isRenderedHTML,
    isReqMatchSuperDomainOrigin,
  })

  const getInjectionLevel = () => {
    if (ctx.incomingRes.headers['x-cypress-file-server-error'] && !ctx.res.isInitial) {
      ctx.debug('- partial injection (x-cypress-file-server-error)')

      return 'partial'
    }

    // NOTE: Only inject fullCrossOrigin if the super domain origins do not match in order to keep parity with cypress application reloads
    const urlDoesNotMatchPolicyBasedOnDomain = !reqMatchesPolicyBasedOnDomain(ctx.req, ctx.remoteStates.getPrimary(), ctx.config.experimentalSkipDomainInjection)
    const isAUTFrame = ctx.req.isAUTFrame
    const isHTMLLike = isHTML || isRenderedHTML

    span?.setAttributes({
      isAUTFrame,
      urlDoesNotMatchPolicyBasedOnDomain,
    })

    if (urlDoesNotMatchPolicyBasedOnDomain && isAUTFrame && isHTMLLike) {
      ctx.debug('- cross origin injection')

      return 'fullCrossOrigin'
    }

    if (!isHTML || (!isReqMatchSuperDomainOrigin && !isAUTFrame)) {
      ctx.debug('- no injection (not html)')

      return false
    }

    if (ctx.res.isInitial && isHTMLLike) {
      ctx.debug('- full injection')

      return 'full'
    }

    if (!isRenderedHTML) {
      ctx.debug('- no injection (not rendered html)')

      return false
    }

    ctx.debug('- partial injection (default)')

    return 'partial'
  }

  if (ctx.res.wantsInjection != null) {
    span?.setAttributes({
      isInjectionAlreadySet: true,
    })

    ctx.debug('- already has injection: %s', ctx.res.wantsInjection)
  }

  if (ctx.res.wantsInjection == null) {
    ctx.res.wantsInjection = getInjectionLevel()
  }

  if (ctx.res.wantsInjection) {
    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    //
    // We set the header here only for proxied requests that have scripts injected that set the domain.
    // Other proxied requests are ignored.
    ctx.res.setHeader('Origin-Agent-Cluster', '?0')
  }

  ctx.res.wantsSecurityRemoved = (ctx.config.modifyObstructiveCode || ctx.config.experimentalModifyObstructiveThirdPartyCode) &&
    // if experimentalModifyObstructiveThirdPartyCode is enabled, we want to modify all framebusting code that is html or javascript that passes through the proxy
    ((ctx.config.experimentalModifyObstructiveThirdPartyCode
      && (isHTML || isRenderedHTML || resContentTypeIsJavaScript(ctx.incomingRes))) ||
     ctx.res.wantsInjection === 'full' ||
     ctx.res.wantsInjection === 'fullCrossOrigin' ||
     // only modify JavasScript if matching the current origin policy or if experimentalModifyObstructiveThirdPartyCode is enabled (above)
     (resContentTypeIsJavaScript(ctx.incomingRes) && isReqMatchSuperDomainOrigin))

  span?.setAttributes({
    wantsInjection: ctx.res.wantsInjection,
    wantsSecurityRemoved: ctx.res.wantsSecurityRemoved,
  })

  ctx.debug('injection levels: %o', _.pick(ctx.res, 'isInitial', 'wantsInjection', 'wantsSecurityRemoved'))

  span?.end()
  ctx.next()
}

// https://github.com/cypress-io/cypress/issues/6480
const MaybeStripDocumentDomainFeaturePolicy: ResponseMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:strip:document:domain:feature:policy', parentSpan: ctx.resMiddlewareSpan })

  const { 'feature-policy': featurePolicy } = ctx.incomingRes.headers

  if (featurePolicy) {
    const directives = parseFeaturePolicy(<string>featurePolicy)

    if (directives['document-domain']) {
      delete directives['document-domain']

      const policy = stringifyFeaturePolicy(directives)

      span?.setAttributes({
        isFeaturePolicy: !!policy,
      })

      if (policy) {
        ctx.res.set('feature-policy', policy)
      } else {
        ctx.res.removeHeader('feature-policy')
      }
    }
  }

  span?.end()
  ctx.next()
}

const OmitProblematicHeaders: ResponseMiddleware = (ctx) => {
  const headers = _.omit(ctx.incomingRes.headers, [
    'set-cookie',
    'x-frame-options',
    'content-length',
    'transfer-encoding',
    'content-security-policy',
    'content-security-policy-report-only',
    'connection',
  ])

  ctx.res.set(headers)

  ctx.next()
}

const MaybePreventCaching: ResponseMiddleware = (ctx) => {
  // do not cache injected responses
  // TODO: consider implementing etag system so even injected content can be cached
  if (ctx.res.wantsInjection) {
    ctx.res.setHeader('cache-control', 'no-cache, no-store, must-revalidate')
  }

  ctx.next()
}

const setSimulatedCookies = (ctx: HttpMiddlewareThis<ResponseMiddlewareProps>) => {
  if (ctx.res.wantsInjection !== 'fullCrossOrigin') return

  const defaultDomain = (new URL(ctx.req.proxiedUrl)).hostname
  const allCookiesForRequest = ctx.getCookieJar()
  .getCookies(ctx.req.proxiedUrl)
  .map((cookie) => toughCookieToAutomationCookie(cookie, defaultDomain))

  ctx.simulatedCookies = allCookiesForRequest
}

const MaybeCopyCookiesFromIncomingRes: ResponseMiddleware = async (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:copy:cookies:from:incoming:res', parentSpan: ctx.resMiddlewareSpan })

  const cookies: string | string[] | undefined = ctx.incomingRes.headers['set-cookie']

  const areCookiesPresent = !cookies || !cookies.length

  span?.setAttributes({
    areCookiesPresent,
  })

  if (areCookiesPresent) {
    setSimulatedCookies(ctx)

    span?.end()

    return ctx.next()
  }

  // Simulated Top Cookie Handling
  // ---------------------------
  // - We capture cookies sent by responses and add them to our own server-side
  //   tough-cookie cookie jar. All request cookies are captured, since any
  //   future request could be cross-origin in the context of top, even if the response that sets them
  //   is not.
  // - If we sent the cookie header, it may fail to be set by the browser
  //   (in most cases). However, we cannot determine all the cases in which Set-Cookie
  //   will currently fail. We try to address this in our tough cookie jar
  //   by only setting cookies that would otherwise work in the browser if the AUT url was top
  // - We also set the cookies through automation so they are available in the
  //   browser via document.cookie and via Cypress cookie APIs
  //   (e.g. cy.getCookie). This is only done when the AUT url and top do not match responses,
  //   since AUT and Top being same origin will be successfully set in the browser
  //   automatically as expected.
  // - In the request middleware, we retrieve the cookies for a given URL
  //   and attach them to the request, like the browser normally would.
  //   tough-cookie handles retrieving the correct cookies based on domain,
  //   path, etc. It also removes cookies from the cookie jar if they've expired.
  const doesTopNeedSimulating = doesTopNeedToBeSimulated(ctx)

  // TODO: should be able to remove as implied with other top spans
  span?.setAttributes({
    doesTopNeedSimulating,
  })

  const appendCookie = (cookie: string) => {
    // always call 'Set-Cookie' in the browser as cross origin or same site requests
    // can effectively set cookies in the browser if given correct credential permissions
    const headerName = 'Set-Cookie'

    try {
      ctx.res.append(headerName, cookie)
    } catch (err) {
      ctx.debug(`failed to append header ${headerName}, continuing %o`, { err, cookie })
    }
  }

  if (!doesTopNeedSimulating) {
    ([] as string[]).concat(cookies).forEach((cookie) => {
      appendCookie(cookie)
    })

    span?.end()

    return ctx.next()
  }

  const cookiesHelper = new CookiesHelper({
    cookieJar: ctx.getCookieJar(),
    currentAUTUrl: ctx.getAUTUrl(),
    debug: ctx.debug,
    request: {
      url: ctx.req.proxiedUrl,
      isAUTFrame: ctx.req.isAUTFrame,
      doesTopNeedSimulating,
      resourceType: ctx.req.resourceType,
      credentialLevel: ctx.req.credentialsLevel,
    },
  })

  await cookiesHelper.capturePreviousCookies()

  ;([] as string[]).concat(cookies).forEach((cookie) => {
    cookiesHelper.setCookie(cookie)

    appendCookie(cookie)
  })

  setSimulatedCookies(ctx)

  const addedCookies = await cookiesHelper.getAddedCookies()
  const wereSimCookiesAdded = addedCookies.length

  span?.setAttributes({
    wereSimCookiesAdded,
  })

  if (!wereSimCookiesAdded) {
    span?.end()

    return ctx.next()
  }

  // we want to set the cookies via automation so they exist in the browser
  // itself. however, firefox will hang if we try to use the extension
  // to set cookies on a url that's in-flight, so we send the cookies down to
  // the driver, let the response go, and set the cookies via automation
  // from the driver once the page has loaded but before we run any further
  // commands
  ctx.serverBus.once('cross:origin:cookies:received', () => {
    span?.end()
    ctx.next()
  })

  ctx.serverBus.emit('cross:origin:cookies', addedCookies)
}

const REDIRECT_STATUS_CODES: any[] = [301, 302, 303, 307, 308]

// TODO: this shouldn't really even be necessary?
const MaybeSendRedirectToClient: ResponseMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:send:redirect:to:client', parentSpan: ctx.resMiddlewareSpan })

  const { statusCode, headers } = ctx.incomingRes
  const newUrl = headers['location']

  const isRedirectNeeded = !REDIRECT_STATUS_CODES.includes(statusCode) || !newUrl

  span?.setAttributes({
    isRedirectNeeded,
  })

  if (isRedirectNeeded) {
    span?.end()

    return ctx.next()
  }

  setInitialCookie(ctx.res, ctx.remoteStates.current(), true)

  ctx.debug('redirecting to new url %o', { statusCode, newUrl })
  ctx.res.redirect(Number(statusCode), newUrl)

  span?.end()

  // TODO; how do we instrument end?
  return ctx.end()
}

const CopyResponseStatusCode: ResponseMiddleware = (ctx) => {
  ctx.res.status(Number(ctx.incomingRes.statusCode))
  // Set custom status message/reason phrase from http response
  // https://github.com/cypress-io/cypress/issues/16973
  if (ctx.incomingRes.statusMessage) {
    ctx.res.statusMessage = ctx.incomingRes.statusMessage
  }

  ctx.next()
}

const ClearCyInitialCookie: ResponseMiddleware = (ctx) => {
  setInitialCookie(ctx.res, ctx.remoteStates.current(), false)
  ctx.next()
}

const MaybeEndWithEmptyBody: ResponseMiddleware = (ctx) => {
  if (httpUtils.responseMustHaveEmptyBody(ctx.req, ctx.incomingRes)) {
    // TODO: how do we instrument end
    ctx.res.end()

    // TODO: how do we instrument end
    return ctx.end()
  }

  ctx.next()
}

const MaybeInjectHtml: ResponseMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:inject:html', parentSpan: ctx.resMiddlewareSpan })

  // TODO: should be able to remove as implied with other top spans
  span?.setAttributes({
    wantsInjection: ctx.res.wantsInjection,
  })

  if (!ctx.res.wantsInjection) {
    span?.end()

    return ctx.next()
  }

  ctx.skipMiddleware('MaybeRemoveSecurity') // we only want to do one or the other

  ctx.debug('injecting into HTML')

  makeResStreamPlainText(ctx)

  const streamSpan = telemetry.startSpan({ name: `maybe:inject:html-resp:stream`, parentSpan: span })

  ctx.incomingResStream.pipe(concatStream(async (body) => {
    const nodeCharset = getNodeCharsetFromResponse(ctx.incomingRes.headers, body, ctx.debug)

    const decodedBody = iconv.decode(body, nodeCharset)
    const injectedBody = await rewriter.html(decodedBody, {
      domainName: cors.getDomainNameFromUrl(ctx.req.proxiedUrl),
      wantsInjection: ctx.res.wantsInjection,
      wantsSecurityRemoved: ctx.res.wantsSecurityRemoved,
      isNotJavascript: !resContentTypeIsJavaScript(ctx.incomingRes),
      useAstSourceRewriting: ctx.config.experimentalSourceRewriting,
      modifyObstructiveThirdPartyCode: ctx.config.experimentalModifyObstructiveThirdPartyCode && !ctx.remoteStates.isPrimarySuperDomainOrigin(ctx.req.proxiedUrl),
      shouldInjectDocumentDomain: cors.shouldInjectDocumentDomain(ctx.req.proxiedUrl, {
        skipDomainInjectionForDomains: ctx.config.experimentalSkipDomainInjection,
      }),
      modifyObstructiveCode: ctx.config.modifyObstructiveCode,
      url: ctx.req.proxiedUrl,
      deferSourceMapRewrite: ctx.deferSourceMapRewrite,
      simulatedCookies: ctx.simulatedCookies,
    })
    const encodedBody = iconv.encode(injectedBody, nodeCharset)

    const pt = new PassThrough

    pt.write(encodedBody)
    pt.end()

    ctx.incomingResStream = pt

    streamSpan?.end()
    ctx.next()
    // TODO: how do we short circuit on error?
  })).on('error', ctx.onError).once('finish', () => {
    // TODO: do we need this?
    span?.end()
  })
}

const MaybeRemoveSecurity: ResponseMiddleware = (ctx) => {
  const span = telemetry.startSpan({
    name: 'maybe:remove:security',
    parentSpan: ctx.resMiddlewareSpan,
  })

  // TODO: should be able to remove as implied with other top spans
  span?.setAttributes({
    wantsSecurityRemoved: ctx.res.wantsSecurityRemoved || false,
  })

  if (!ctx.res.wantsSecurityRemoved) {
    span?.end()

    return ctx.next()
  }

  ctx.debug('removing JS framebusting code')

  // ctx.makeResStreamPlainText()
  makeResStreamPlainText(ctx)

  ctx.incomingResStream.setEncoding('utf8')

  const streamSpan = telemetry.startSpan({ name: `maybe:remove:security-resp:stream`, parentSpan: span })

  ctx.incomingResStream = ctx.incomingResStream.pipe(rewriter.security({
    isNotJavascript: !resContentTypeIsJavaScript(ctx.incomingRes),
    useAstSourceRewriting: ctx.config.experimentalSourceRewriting,
    modifyObstructiveThirdPartyCode: ctx.config.experimentalModifyObstructiveThirdPartyCode && !ctx.remoteStates.isPrimarySuperDomainOrigin(ctx.req.proxiedUrl),
    modifyObstructiveCode: ctx.config.modifyObstructiveCode,
    url: ctx.req.proxiedUrl,
    deferSourceMapRewrite: ctx.deferSourceMapRewrite,
  }))
  .on('error', ctx.onError)
  .once('finish', () => {
    streamSpan?.end()
  })

  span?.end()
  ctx.next()
}

const GzipBody: ResponseMiddleware = (ctx) => {
  if (ctx.isGunzipped) {
    ctx.debug('regzipping response body')
    const span = telemetry.startSpan({ name: 'gzip:body', parentSpan: ctx.resMiddlewareSpan })

    ctx.incomingResStream = ctx.incomingResStream
    .pipe(zlib.createGzip(zlibOptions))
    .on('error', ctx.onError)
    .once('finish', () => {
      span?.end()
    })
  }

  ctx.next()
}

const SendResponseBodyToClient: ResponseMiddleware = (ctx) => {
  if (ctx.req.isAUTFrame) {
    // track the previous AUT request URL so we know if the next requests
    // is cross-origin
    ctx.setAUTUrl(ctx.req.proxiedUrl)
  }

  // TODO: do we need to instrument this?
  ctx.incomingResStream.pipe(ctx.res).on('error', ctx.onError)

  ctx.res.once('finish', () => {
    ctx.end()
  })
}

export default {
  LogResponse,
  InterceptResponse,
  PatchExpressSetHeader,
  SetInjectionLevel,
  OmitProblematicHeaders,
  MaybePreventCaching,
  MaybeStripDocumentDomainFeaturePolicy,
  MaybeCopyCookiesFromIncomingRes,
  MaybeSendRedirectToClient,
  CopyResponseStatusCode,
  ClearCyInitialCookie,
  MaybeEndWithEmptyBody,
  MaybeInjectHtml,
  MaybeRemoveSecurity,
  GzipBody,
  SendResponseBodyToClient,
}
