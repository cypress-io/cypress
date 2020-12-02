import _ from 'lodash'
import charset from 'charset'
import { CookieOptions } from 'express'
import { cors, concatStream, httpUtils } from '@packages/network'
import { CypressIncomingRequest, CypressOutgoingResponse } from '@packages/proxy'
import debugModule from 'debug'
import { HttpMiddleware } from '.'
import iconv from 'iconv-lite'
import { IncomingMessage, IncomingHttpHeaders } from 'http'
import { InterceptResponse } from '@packages/net-stubbing'
import { PassThrough, Readable } from 'stream'
import * as rewriter from './util/rewriter'
import zlib from 'zlib'

export type ResponseMiddleware = HttpMiddleware<{
  /**
   * Before using `res.incomingResStream`, `prepareResStream` can be used
   * to remove any encoding that prevents it from being returned as plain text.
   *
   * This is done as-needed to avoid unnecessary g(un)zipping.
   */
  makeResStreamPlainText: () => void
  isGunzipped: boolean
  incomingRes: IncomingMessage
  incomingResStream: Readable
}>

const debug = debugModule('cypress:proxy:http:response-middleware')

// https://github.com/cypress-io/cypress/issues/1756
const zlibOptions = {
  flush: zlib.Z_SYNC_FLUSH,
  finishFlush: zlib.Z_SYNC_FLUSH,
}

// https://github.com/cypress-io/cypress/issues/1543
function getNodeCharsetFromResponse (headers: IncomingHttpHeaders, body: Buffer) {
  const httpCharset = (charset(headers, body, 1024) || '').toLowerCase()

  debug('inferred charset from response %o', { httpCharset })
  if (iconv.encodingExists(httpCharset)) {
    return httpCharset
  }

  // browsers default to latin1
  return 'latin1'
}

function reqMatchesOriginPolicy (req: CypressIncomingRequest, remoteState) {
  if (remoteState.strategy === 'http') {
    return cors.urlMatchesOriginPolicyProps(req.proxiedUrl, remoteState.props)
  }

  if (remoteState.strategy === 'file') {
    return req.proxiedUrl.startsWith(remoteState.origin)
  }

  return false
}

function reqWillRenderHtml (req: CypressIncomingRequest) {
  // will this request be rendered in the browser, necessitating injection?
  // https://github.com/cypress-io/cypress/issues/288

  // don't inject if this is an XHR from jquery
  if (req.headers['x-requested-with']) {
    return
  }

  // don't inject if we didn't find both text/html and application/xhtml+xml,
  const accept = req.headers['accept']

  return accept && accept.includes('text/html') && accept.includes('application/xhtml+xml')
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

function isHtml (res: IncomingMessage) {
  return !resContentTypeIsJavaScript(res)
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

const LogResponse: ResponseMiddleware = function () {
  debug('received response %o', {
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
    incomingRes: _.pick(this.incomingRes, 'headers', 'statusCode'),
  })

  this.next()
}

const AttachPlainTextStreamFn: ResponseMiddleware = function () {
  this.makeResStreamPlainText = function () {
    debug('ensuring resStream is plaintext')

    if (!this.isGunzipped && resIsGzipped(this.incomingRes)) {
      debug('gunzipping response body')

      const gunzip = zlib.createGunzip(zlibOptions)

      this.incomingResStream = this.incomingResStream.pipe(gunzip).on('error', this.onError)

      this.isGunzipped = true
    }
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
    } catch (err) {
      if (err.code !== 'ERR_INVALID_CHAR') {
        throw err
      }

      debug('setHeader error ignored %o', { name, value, code: err.code, err })

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

const SetInjectionLevel: ResponseMiddleware = function () {
  this.res.isInitial = this.req.cookies['__cypress.initial'] === 'true'

  const isReqMatchOriginPolicy = reqMatchesOriginPolicy(this.req, this.getRemoteState())
  const getInjectionLevel = () => {
    if (this.incomingRes.headers['x-cypress-file-server-error'] && !this.res.isInitial) {
      return 'partial'
    }

    if (!resContentTypeIs(this.incomingRes, 'text/html') || !isReqMatchOriginPolicy) {
      return false
    }

    if (this.res.isInitial) {
      return 'full'
    }

    if (!reqWillRenderHtml(this.req)) {
      return false
    }

    return 'partial'
  }

  if (!this.res.wantsInjection) {
    this.res.wantsInjection = getInjectionLevel()
  }

  this.res.wantsSecurityRemoved = this.config.modifyObstructiveCode && isReqMatchOriginPolicy && (
    (this.res.wantsInjection === 'full')
    || resContentTypeIsJavaScript(this.incomingRes)
  )

  debug('injection levels: %o', _.pick(this.res, 'isInitial', 'wantsInjection', 'wantsSecurityRemoved'))

  this.next()
}

// https://github.com/cypress-io/cypress/issues/6480
const MaybeStripDocumentDomainFeaturePolicy: ResponseMiddleware = function () {
  const { 'feature-policy': featurePolicy } = this.incomingRes.headers

  if (featurePolicy) {
    const directives = parseFeaturePolicy(<string>featurePolicy)

    if (directives['document-domain']) {
      delete directives['document-domain']

      const policy = stringifyFeaturePolicy(directives)

      if (policy) {
        this.res.set('feature-policy', policy)
      } else {
        this.res.removeHeader('feature-policy')
      }
    }
  }

  this.next()
}

const OmitProblematicHeaders: ResponseMiddleware = function () {
  const headers = _.omit(this.incomingRes.headers, [
    'set-cookie',
    'x-frame-options',
    'content-length',
    'transfer-encoding',
    'content-security-policy',
    'content-security-policy-report-only',
    'connection',
  ])

  this.res.set(headers)

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

const CopyCookiesFromIncomingRes: ResponseMiddleware = function () {
  const cookies: string | string[] | undefined = this.incomingRes.headers['set-cookie']

  if (cookies) {
    ([] as string[]).concat(cookies).forEach((cookie) => {
      try {
        this.res.append('Set-Cookie', cookie)
      } catch (err) {
        debug('failed to Set-Cookie, continuing %o', { err, cookie })
      }
    })
  }

  this.next()
}

const REDIRECT_STATUS_CODES: any[] = [301, 302, 303, 307, 308]

// TODO: this shouldn't really even be necessary?
const MaybeSendRedirectToClient: ResponseMiddleware = function () {
  const { statusCode, headers } = this.incomingRes
  const newUrl = headers['location']

  if (!REDIRECT_STATUS_CODES.includes(statusCode) || !newUrl) {
    return this.next()
  }

  setInitialCookie(this.res, this.getRemoteState(), true)

  debug('redirecting to new url %o', { statusCode, newUrl })
  this.res.redirect(Number(statusCode), newUrl)

  return this.end()
}

const CopyResponseStatusCode: ResponseMiddleware = function () {
  this.res.status(Number(this.incomingRes.statusCode))
  this.next()
}

const ClearCyInitialCookie: ResponseMiddleware = function () {
  setInitialCookie(this.res, this.getRemoteState(), false)
  this.next()
}

const MaybeEndWithEmptyBody: ResponseMiddleware = function () {
  if (httpUtils.responseMustHaveEmptyBody(this.req, this.incomingRes)) {
    this.res.end()

    return this.end()
  }

  this.next()
}

const MaybeInjectHtml: ResponseMiddleware = function () {
  if (!this.res.wantsInjection) {
    return this.next()
  }

  this.skipMiddleware('MaybeRemoveSecurity') // we only want to do one or the other

  debug('injecting into HTML')

  this.makeResStreamPlainText()

  this.incomingResStream.pipe(concatStream(async (body) => {
    const nodeCharset = getNodeCharsetFromResponse(this.incomingRes.headers, body)
    const decodedBody = iconv.decode(body, nodeCharset)
    const injectedBody = await rewriter.html(decodedBody, {
      domainName: this.getRemoteState().domainName,
      wantsInjection: this.res.wantsInjection,
      wantsSecurityRemoved: this.res.wantsSecurityRemoved,
      isHtml: isHtml(this.incomingRes),
      useAstSourceRewriting: this.config.experimentalSourceRewriting,
      url: this.req.proxiedUrl,
      deferSourceMapRewrite: this.deferSourceMapRewrite,
    })
    const encodedBody = iconv.encode(injectedBody, nodeCharset)

    const pt = new PassThrough

    pt.write(encodedBody)
    pt.end()

    this.incomingResStream = pt
    this.next()
  })).on('error', this.onError)
}

const MaybeRemoveSecurity: ResponseMiddleware = function () {
  if (!this.res.wantsSecurityRemoved) {
    return this.next()
  }

  debug('removing JS framebusting code')

  this.makeResStreamPlainText()

  this.incomingResStream.setEncoding('utf8')
  this.incomingResStream = this.incomingResStream.pipe(rewriter.security({
    isHtml: isHtml(this.incomingRes),
    useAstSourceRewriting: this.config.experimentalSourceRewriting,
    url: this.req.proxiedUrl,
    deferSourceMapRewrite: this.deferSourceMapRewrite,
  })).on('error', this.onError)

  this.next()
}

const GzipBody: ResponseMiddleware = function () {
  if (this.isGunzipped) {
    debug('regzipping response body')
    this.incomingResStream = this.incomingResStream.pipe(zlib.createGzip(zlibOptions)).on('error', this.onError)
  }

  this.next()
}

const SendResponseBodyToClient: ResponseMiddleware = function () {
  this.incomingResStream.pipe(this.res).on('error', this.onError)
  this.res.on('end', () => this.end())
}

export default {
  LogResponse,
  AttachPlainTextStreamFn,
  InterceptResponse,
  PatchExpressSetHeader,
  SetInjectionLevel,
  OmitProblematicHeaders,
  MaybePreventCaching,
  MaybeStripDocumentDomainFeaturePolicy,
  CopyCookiesFromIncomingRes,
  MaybeSendRedirectToClient,
  CopyResponseStatusCode,
  ClearCyInitialCookie,
  MaybeEndWithEmptyBody,
  MaybeInjectHtml,
  MaybeRemoveSecurity,
  GzipBody,
  SendResponseBodyToClient,
}
