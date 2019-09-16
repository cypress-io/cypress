import _ from 'lodash'
import charset from 'charset'
import concatStream from 'concat-stream'
import { CookieOptions } from 'express'
import { cors } from '@packages/network'
import { CypressRequest, CypressResponse, HttpMiddleware } from '.'
import debugModule from 'debug'
import iconv from 'iconv-lite'
import { IncomingMessage, IncomingHttpHeaders } from 'http'
import { PassThrough, Readable } from 'stream'
import * as rewriter from './util/rewriter'
import zlib from 'zlib'

export type ResponseMiddleware = HttpMiddleware<{
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

function reqMatchesOriginPolicy (req: CypressRequest, remoteState) {
  if (remoteState.strategy === 'http') {
    return cors.urlMatchesOriginPolicyProps(req.proxiedUrl, remoteState.props)
  }

  if (remoteState.strategy === 'file') {
    return req.proxiedUrl.startsWith(remoteState.origin)
  }

  return false
}

function reqWillRenderHtml (req: CypressRequest) {
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
    .map(_.partial(resContentTypeIs, res))
  )
}

function resIsGzipped (res: IncomingMessage) {
  return (res.headers['content-encoding'] || '').includes('gzip')
}

// https://github.com/cypress-io/cypress/issues/4298
// https://tools.ietf.org/html/rfc7230#section-3.3.3
// HEAD, 1xx, 204, and 304 responses should never contain anything after headers
const NO_BODY_STATUS_CODES = [204, 304]

function responseMustHaveEmptyBody (req: CypressRequest, res: IncomingMessage) {
  return _.some([_.includes(NO_BODY_STATUS_CODES, res.statusCode), _.invoke(req.method, 'toLowerCase') === 'head'])
}

function setCookie (res: CypressResponse, k: string, v: string, domain: string) {
  let opts : CookieOptions = { domain }

  if (!v) {
    v = ''

    opts.expires = new Date(0)
  }

  return res.cookie(k, v, opts)
}

function setInitialCookie (res: CypressResponse, remoteState: any, value) {
  // dont modify any cookies if we're trying to clear the initial cookie and we're not injecting anything
  // dont set the cookies if we're not on the initial request
  if ((!value && !res.wantsInjection) || !res.isInitial) {
    return
  }

  return setCookie(res, '__cypress.initial', value, remoteState.domainName)
}

const LogResponse : ResponseMiddleware = function () {
  debug('received response %o', {
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
    incomingRes: _.pick(this.incomingRes, 'headers', 'statusCode'),
  })

  this.next()
}

const PatchExpressSetHeader : ResponseMiddleware = function () {
  const originalSetHeader = this.res.setHeader

  // express.Response.setHeader does all kinds of silly/nasty stuff to the content-type...
  // but we don't want to change it at all!
  this.res.setHeader = (k, v) => {
    if (k === 'content-type') {
      v = this.incomingRes.headers['content-type'] || v
    }

    return originalSetHeader.call(this.res, k, v)
  }

  this.next()
}

const SetInjectionLevel : ResponseMiddleware = function () {
  this.res.isInitial = this.req.cookies['__cypress.initial'] === 'true'

  const getInjectionLevel = () => {
    if (this.incomingRes.headers['x-cypress-file-server-error'] && !this.res.isInitial) {
      return 'partial'
    }

    if (!resContentTypeIs(this.incomingRes, 'text/html') || !reqMatchesOriginPolicy(this.req, this.getRemoteState())) {
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

  this.res.wantsSecurityRemoved = this.config.modifyObstructiveCode && (
    (this.res.wantsInjection === 'full')
    || resContentTypeIsJavaScript(this.incomingRes)
  )

  debug('injection levels: %o', _.pick(this.res, 'isInitial', 'wantsInjection', 'wantsSecurityRemoved'))

  this.next()
}

const OmitProblematicHeaders : ResponseMiddleware = function () {
  const headers = _.omit(this.incomingRes.headers, [
    'set-cookie',
    'x-frame-options',
    'content-length',
    'content-security-policy',
    'connection',
  ])

  this.res.set(headers)

  this.next()
}

const MaybePreventCaching : ResponseMiddleware = function () {
  // do not cache injected responses
  // TODO: consider implementing etag system so even injected content can be cached
  if (this.res.wantsInjection) {
    this.res.setHeader('cache-control', 'no-cache, no-store, must-revalidate')
  }

  this.next()
}

const CopyCookiesFromIncomingRes : ResponseMiddleware = function () {
  const cookies : string | string[] | undefined = this.incomingRes.headers['set-cookie']

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

const REDIRECT_STATUS_CODES : any[] = [301, 302, 303, 307, 308]

// TODO: this shouldn't really even be necessary?
const MaybeSendRedirectToClient : ResponseMiddleware = function () {
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

const CopyResponseStatusCode : ResponseMiddleware = function () {
  this.res.status(Number(this.incomingRes.statusCode))
  this.next()
}

const ClearCyInitialCookie : ResponseMiddleware = function () {
  setInitialCookie(this.res, this.getRemoteState(), false)
  this.next()
}

const MaybeEndWithEmptyBody : ResponseMiddleware = function () {
  if (responseMustHaveEmptyBody(this.req, this.incomingRes)) {
    this.res.end()

    return this.end()
  }

  this.next()
}

const MaybeGunzipBody : ResponseMiddleware = function () {
  if (resIsGzipped(this.incomingRes) && (this.res.wantsInjection || this.res.wantsSecurityRemoved)) {
    debug('ungzipping response body')

    const gunzip = zlib.createGunzip(zlibOptions)

    this.incomingResStream = this.incomingResStream.pipe(gunzip).on('error', this.onError)
  } else {
    this.skipMiddleware('GzipBody') // not needed anymore
  }

  this.next()
}

const MaybeInjectHtml : ResponseMiddleware = function () {
  if (!this.res.wantsInjection) {
    return this.next()
  }

  this.skipMiddleware('MaybeRemoveSecurity') // we only want to do one or the other

  debug('injecting into HTML')

  this.incomingResStream.pipe(concatStream((body) => {
    const nodeCharset = getNodeCharsetFromResponse(this.incomingRes.headers, body)
    const decodedBody = iconv.decode(body, nodeCharset)
    const injectedBody = rewriter.html(decodedBody, this.getRemoteState().domainName, this.res.wantsInjection, this.res.wantsSecurityRemoved)
    const encodedBody = iconv.encode(injectedBody, nodeCharset)

    const pt = new PassThrough

    pt.write(encodedBody)
    pt.end()

    this.incomingResStream = pt
    this.next()
  })).on('error', this.onError)
}

const MaybeRemoveSecurity : ResponseMiddleware = function () {
  if (!this.res.wantsSecurityRemoved) {
    return this.next()
  }

  debug('removing JS framebusting code')

  this.incomingResStream.setEncoding('utf8')
  this.incomingResStream = this.incomingResStream.pipe(rewriter.security()).on('error', this.onError)
  this.next()
}

const GzipBody : ResponseMiddleware = function () {
  debug('regzipping response body')
  this.incomingResStream = this.incomingResStream.pipe(zlib.createGzip(zlibOptions)).on('error', this.onError)

  this.next()
}

const SendResponseBodyToClient : ResponseMiddleware = function () {
  this.incomingResStream.pipe(this.res).on('error', this.onError)
  this.res.on('end', () => this.end())
}

export default {
  LogResponse,
  PatchExpressSetHeader,
  SetInjectionLevel,
  OmitProblematicHeaders,
  MaybePreventCaching,
  CopyCookiesFromIncomingRes,
  MaybeSendRedirectToClient,
  CopyResponseStatusCode,
  ClearCyInitialCookie,
  MaybeEndWithEmptyBody,
  MaybeGunzipBody,
  MaybeInjectHtml,
  MaybeRemoveSecurity,
  GzipBody,
  SendResponseBodyToClient,
}
