import _ from 'lodash'
import cypress_request from '@cypress/request'
import cypress_request_promise from '@cypress/request-promise'
import url from 'url'
import tough from 'tough-cookie'
import Promise from 'bluebird'
import stream from 'stream'
import duplexify, { Duplexify } from 'duplexify'
import { agent } from '@packages/network'
import debugFn from 'debug'
import statusCode from './util/status_code'
import { StreamBuffer, streamBuffer } from './util/stream_buffer'
import type { CombinedAgent } from '@packages/network/lib/agent'
import type { BrowserPreRequest } from '@packages/proxy'
import type { IncomingMessage } from 'http'

const debug = debugFn('cypress:server:request')
const SERIALIZABLE_COOKIE_PROPS = ['name', 'value', 'domain', 'expiry', 'path', 'secure', 'hostOnly', 'httpOnly', 'sameSite']
const NETWORK_ERRORS = 'ECONNREFUSED ECONNRESET EPIPE EHOSTUNREACH EAI_AGAIN ENOTFOUND'.split(' ')
const VERBOSE_REQUEST_OPTS = 'followRedirect strictSSL'.split(' ')
const HTTP_CLIENT_REQUEST_EVENTS = 'abort connect continue information socket timeout upgrade'.split(' ')
const TLS_VERSION_ERROR_RE = /TLSV1_ALERT_PROTOCOL_VERSION|UNSUPPORTED_PROTOCOL/
const SAMESITE_NONE_RE = /; +samesite=(?:'none'|"none"|none)/i

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export type RequestCreateOptions = {
  browserPreRequest?: BrowserPreRequest
  timeout?: number
  strictSSL: boolean
  followRedirect: boolean | ((res: IncomingMessage) => boolean)
  retryIntervals: number[]
  url: string
  time?: boolean
  // property should only exist on buffered requests (TODO: verify type)
  method?: string
  // property should only exist on buffered requests (TODO: verify type)
  headers?: {[key: string]: string}
  // property should only exist on buffered requests
  body?: string
}

type RequestOptionMetaData = {
  requestId: string
  retryOnNetworkFailure: boolean
  retryOnStatusCodeFailure: boolean
  delaysRemaining: number[]
  minVersion?: 'TLSv1'
}

type RequestOptionsWithDefaults = RequestCreateOptions & RequestOptionMetaData

// TODO: move this type to the agent. Also needs verification
type AgentProxySockErr = Error & {
  originalErr?: Error
  code: string
}

// signature used to retry a request on status code or network failures
type RetryFnSignature = ({ delay, attempt }: {
  delay: number
  attempt?: number
}) => Promise<any>

type SendPromiseOptions = {
  url: string
  cookies: boolean
  method?: string
  form?: boolean
  json?: boolean
  gzip: boolean
  encoding: null | any
  body?: any
  headers: { [key: string]: string }
  followRedirect: boolean | ((res: IncomingMessage) => boolean)
  followAllRedirects?: boolean
  bodyIsBase64Encoded?: boolean
}

type SendStreamOptions = {
  url: string
  cookies: boolean
  headers: { [key: string]: string }
  followRedirect: boolean | ((res: IncomingMessage) => boolean)
  followAllRedirects?: boolean
  strictSSL: boolean
  onBeforeReqInit: <T>(fn: () => T) => T
}

const convertSameSiteToughToExtension = (sameSite: string, setCookie: string): Cypress.SameSiteStatus | undefined => {
  // tough-cookie@4.0.0 uses 'none' as a default, so run this regex to detect if
  // SameSite=None was not explicitly set
  // @see https://github.com/salesforce/tough-cookie/issues/191
  const isUnspecified = (sameSite === 'none') && !SAMESITE_NONE_RE.test(setCookie)

  if (isUnspecified) {
    // not explicitly set, so fall back to the browser's default
    return undefined
  }

  if (sameSite === 'none') {
    return 'no_restriction'
  }

  return sameSite as 'strict' | 'lax'
}

// TODO: figure out type of req
const getOriginalHeaders = (req = {}) => {
  // the request instance holds an instance
  // of the original ClientRequest
  // as the 'req' property which holds the
  // original headers else fall back to
  // the normal req.headers
  // @ts-expect-error
  return _.get(req, 'req.headers', req.headers)
}

const hasRetriableStatusCodeFailure = (res: IncomingMessage, retryOnStatusCodeFailure: boolean) => {
  // everything must be true in order to
  // retry a status code failure
  return _.every([
    retryOnStatusCodeFailure,
    !statusCode.isOk(res.statusCode),
  ])
}

const isErrEmptyResponseError = (err: Error) => {
  return _.startsWith(err.message, 'ERR_EMPTY_RESPONSE')
}

const isRetriableError = (err: AgentProxySockErr, retryOnNetworkFailure: boolean) => {
  return _.every([
    retryOnNetworkFailure,
    _.includes(NETWORK_ERRORS, err.code),
  ])
}

const merge = (...args) => {
  return _.chain({})
  .extend(...args)
  .omit(VERBOSE_REQUEST_OPTS)
  .value()
}

const pick = function (resp: IncomingMessage) {
  // TODO: figure out what type is
  // @ts-expect-error
  const req = resp.request != null ? resp.request : {}

  const headers = getOriginalHeaders(req)

  return {
    'Request Body': req.body != null ? req.body : null,
    'Request Headers': headers,
    'Request URL': req.href,
    // @ts-expect-error
    'Response Body': resp.body != null ? resp.body : null,
    'Response Headers': resp.headers,
    'Response Status': resp.statusCode,
  }
}

const pipeEvent = (source, destination, event) => {
  return source.on(event, (...args) => {
    destination.emit(event, ...args)
  })
}

const caseInsensitiveGet = function (obj, property) {
  const lowercaseProperty = property.toLowerCase()

  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return obj[key]
    }
  }
}

// first, attempt to set on an existing property with differing case
// if that fails, set the lowercase `property`
const caseInsensitiveSet = function (obj, property, val) {
  const lowercaseProperty = property.toLowerCase()

  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      obj[key] = val
    }
  }

  obj[lowercaseProperty] = val
}

export class Request {
  private defaults: {
    timeout?: number
    agent: CombinedAgent
    headers: {[key: string]: string}
    proxy: any
  }

  // TODO: library needs typings
  private cypress_request: any
  // TODO: library needs typings
  private cypress_request_promise: any

  constructor (options: {
    timeout?: number
  } = {
    timeout: undefined,
  }) {
    this.defaults = {
      timeout: options.timeout,
      agent,
      // send keep-alive with requests since Chrome won't send it in proxy mode
      // https://github.com/cypress-io/cypress/pull/3531#issuecomment-476269041
      headers: {
        'Connection': 'keep-alive',
      },
      proxy: null, // upstream proxying is handled by CombinedAgent
    }

    this.cypress_request = cypress_request.defaults(this.defaults)
    this.cypress_request_promise = cypress_request_promise.defaults(this.defaults)
  }

  private createRetryingRequestStream (opts: RequestOptionsWithDefaults) {
    // TODO: verify opts is always supplied to this method
    const {
      requestId,
      retryIntervals,
      delaysRemaining,
      retryOnNetworkFailure,
      retryOnStatusCodeFailure,
    } = opts

    // TODO: what type is this?
    let req = null

    const delayStream = new stream.PassThrough()
    let reqBodyBuffer: (StreamBuffer & stream.Writable) | null = streamBuffer()

    // the aborted property is added inside this function
    // TODO: how is this forwarded or is this dead code?
    type AugmentedCypressRetrySteamProperties = {
      aborted?: boolean
      abort: () => void
    }

    const retryStream: Duplexify & AugmentedCypressRetrySteamProperties = duplexify(reqBodyBuffer, delayStream) as Duplexify & AugmentedCypressRetrySteamProperties

    const cleanup = function () {
      if (reqBodyBuffer) {
        // null req body out to free memory
        reqBodyBuffer.unpipeAll()
        reqBodyBuffer = null
      }
    }

    const emitError = function (err: Error) {
      retryStream.emit('error', err)

      cleanup()
    }

    const tryStartStream = () => {
      // if our request has been aborted
      // in the time that we were waiting to retry
      // then immediately bail
      if (retryStream.aborted) {
        return
      }

      // TODO: type request for cypress request lib
      const reqStream = this.cypress_request(opts)
      let didReceiveResponse = false

      const retry: RetryFnSignature = function ({ delay, attempt }) {
        retryStream.emit('retry', { attempt, delay })

        return Promise.delay(delay).then(tryStartStream)
        // TODO: should do the same thing but verify
        // return setTimeout(tryStartStream, delay)
      }

      // if we're retrying and we previous piped
      // into the reqStream, then reapply this now
      if (req) {
        reqStream.emit('pipe', req)
        reqBodyBuffer?.createReadStream().pipe(reqStream)
      }

      // forward the abort call to the underlying request which is called inside @cypress/request
      retryStream.abort = function () {
        debug('aborting', { requestId })
        retryStream.aborted = true

        reqStream.abort()
      }

      // TODO: what is the type of src and req?
      const onPiped = function (src: any) {
        // store this IncomingMessage so we can reapply it
        // if we need to retry
        req = src

        // https://github.com/request/request/blob/b3a218dc7b5689ce25be171e047f0d4f0eef8919/request.js#L493
        // the request lib expects this 'pipe' event in
        // order to copy the request headers onto the
        // outgoing message - so we manually pipe it here
        src.pipe(reqStream)
      }

      // when this passthrough stream is being piped into
      // then make sure we properly "forward" and connect
      // forward it to the real reqStream which enables
      // request to read off the IncomingMessage readable stream
      retryStream.once('pipe', onPiped)

      reqStream.on('error', (err: AgentProxySockErr) => {
        if (didReceiveResponse) {
          // if we've already begun processing the requests
          // response, then that means we failed during transit
          // and its no longer safe to retry. all we can do now
          // is propogate the error upwards
          debug('received an error on request after response started %o', merge(opts, { err }))

          return emitError(err)
        }

        // otherwise, see if we can retry another request under the hood...
        return this.maybeRetryOnNetworkFailure(err, {
          opts,
          retryIntervals,
          delaysRemaining,
          retryOnNetworkFailure,
          retryFn: retry,
          onEnd () {
            return emitError(err)
          },
        })
      })

      reqStream.once('request', (req) => {
        // remove the pipe listener since once the request has
        // been made, we cannot pipe into the reqStream anymore
        retryStream.removeListener('pipe', onPiped)
      })

      reqStream.once('response', (incomingRes: IncomingMessage) => {
        didReceiveResponse = true

        // ok, no net error, but what about a bad status code?
        return this.maybeRetryOnStatusCodeFailure(incomingRes, {
          opts,
          requestId,
          delaysRemaining,
          retryIntervals,
          retryOnStatusCodeFailure,
          retryFn: retry,
          onEnd () {
            debug('successful response received', { requestId })

            cleanup()

            // forward the response event upwards which should happen
            // prior to the pipe event, same as what request does
            // https://github.com/request/request/blob/master/request.js#L1059
            retryStream.emit('response', incomingRes)

            reqStream.pipe(delayStream)

            // `http.ClientRequest` events
            return _.map(HTTP_CLIENT_REQUEST_EVENTS, _.partial(pipeEvent, reqStream, retryStream))
          },
        })
      })
    }

    tryStartStream()

    return retryStream
  }

  private createRetryingRequestPromise (opts) {
    const {
      requestId,
      retryIntervals,
      delaysRemaining,
      retryOnNetworkFailure,
      retryOnStatusCodeFailure,
    } = opts

    const retry: RetryFnSignature = ({ delay }) => {
      return Promise.delay(delay)
      .then(() => {
        return this.createRetryingRequestPromise(opts)
      })
    }

    return this.cypress_request_promise(opts)
    .catch((err) => {
      // rp wraps network errors in a RequestError, so might need to unwrap it to check
      return this.maybeRetryOnNetworkFailure(err.error || err, {
        opts,
        retryIntervals,
        delaysRemaining,
        retryOnNetworkFailure,
        retryFn: retry,
        onEnd () {
          throw err
        },
      })
    }).then((res) => {
      // ok, no net error, but what about a bad status code?
      return this.maybeRetryOnStatusCodeFailure(res, {
        opts,
        requestId,
        retryIntervals,
        delaysRemaining,
        retryOnStatusCodeFailure,
        retryFn: retry,
        onEnd: _.constant(res),
      })
    })
  }

  private maybeRetryOnNetworkFailure (err: AgentProxySockErr, options: {
    opts: RequestOptionsWithDefaults
    retryIntervals: number[]
    delaysRemaining: number[]
    retryOnNetworkFailure: boolean
    retryFn: RetryFnSignature
    onEnd: () => void
  }) {
    const {
      opts,
      retryIntervals,
      delaysRemaining,
      retryOnNetworkFailure,
      retryFn,
      onEnd,
    } = options

    debug('received an error making http request %o', merge(opts, { err }))

    const isTlsVersionError = TLS_VERSION_ERROR_RE.test(err.message)

    if (isTlsVersionError) {
      // because doing every connection via TLSv1 can lead to slowdowns, we set it only on failure
      // https://github.com/cypress-io/cypress/pull/6705
      debug('detected TLS version error, setting min version to TLSv1')
      opts.minVersion = 'TLSv1'

      if (retryIntervals.length === 0) {
        // normally, this request would not be retried, but we need to retry in order to support TLSv1
        return retryFn({ delay: 0, attempt: 1 })
      }
    }

    if (!isTlsVersionError && !isErrEmptyResponseError(err.originalErr || err) && !isRetriableError(err, retryOnNetworkFailure)) {
      return onEnd()
    }

    // else see if we have more delays left...
    return this.getDelayForRetry({
      err,
      opts,
      retryIntervals,
      delaysRemaining,
      retryFn,
      onEnd,
    })
  }

  private maybeRetryOnStatusCodeFailure (res: IncomingMessage, options: {
    err?: AgentProxySockErr
    opts: RequestOptionsWithDefaults
    retryIntervals: number[]
    retryFn: RetryFnSignature
    onEnd: () => void
  }& {
    requestId: string
    retryOnStatusCodeFailure: boolean
    delaysRemaining: number[]
  }) {
    const {
      err,
      opts,
      requestId,
      retryIntervals,
      delaysRemaining,
      retryOnStatusCodeFailure,
      retryFn,
      onEnd,
    } = options

    debug('received status code & headers on request %o', {
      requestId,
      statusCode: res.statusCode,
      headers: _.pick(res.headers, 'content-type', 'set-cookie', 'location'),
    })

    // is this a retryable status code failure?
    if (!hasRetriableStatusCodeFailure(res, retryOnStatusCodeFailure)) {
      // if not then we're done here
      return onEnd()
    }

    // else see if we have more delays left...
    return this.getDelayForRetry({
      err,
      opts,
      retryIntervals,
      delaysRemaining,
      retryFn,
      onEnd,
    })
  }

  private getDelayForRetry (options: {
    err?: AgentProxySockErr
    opts: RequestOptionsWithDefaults
    retryIntervals: number[]
    delaysRemaining: number[]
    retryFn: RetryFnSignature
    onEnd: () => void
  }) {
    const { err, opts, delaysRemaining, retryIntervals, retryFn, onEnd } = options

    let delay = delaysRemaining.shift()

    if (!_.isNumber(delay)) {
      // no more delays, bailing
      debug('exhausted all attempts retrying request %o', merge(opts, { err }))

      return onEnd()
    }

    // figure out which attempt we're on...
    const attempt = retryIntervals.length - delaysRemaining.length

    // if this ECONNREFUSED and we are
    // retrying greater than 1 second
    // then divide the delay interval
    // by 10 so it doesn't wait as long to retry
    // TODO: do we really want to do this?
    if ((delay >= 1000) && (_.get(err, 'code') === 'ECONNREFUSED')) {
      delay = delay / 10
    }

    debug('retrying request %o', merge(opts, {
      delay,
      attempt,
    }))

    return retryFn({ delay, attempt })
  }

  private setDefaults (opts?: RequestCreateOptions): RequestOptionsWithDefaults {
    return _
    .chain(opts)
    .defaults({
      requestId: _.uniqueId('request'),
      retryIntervals: [],
      retryOnNetworkFailure: true,
      retryOnStatusCodeFailure: false,
    })
    .thru((opts) => {
      return _.defaults(opts, {
        delaysRemaining: _.clone(opts.retryIntervals),
      })
    }).value()
  }

  create (opts?: RequestCreateOptions, usePromise: boolean = false) {
    const optDefaults = this.setDefaults(opts)

    if (usePromise) {
      return this.createRetryingRequestPromise(optDefaults)
    }

    return this.createRetryingRequestStream(optDefaults)
  }

  private contentTypeIsJson (response) {
    // TODO: use https://github.com/jshttp/type-is for this
    // https://github.com/cypress-io/cypress/pull/5166
    if (response && response.headers && response.headers['content-type']) {
      return response.headers['content-type'].split(';', 2)[0].endsWith('json')
    }
  }

  private parseJsonBody (body) {
    try {
      return JSON.parse(body)
    } catch (e) {
      return body
    }
  }

  private normalizeResponse (push, response) {
    const req = response.request != null ? response.request : {}

    push(response)

    response = _.pick(response, 'statusCode', 'body', 'headers')

    // normalize status
    response.status = response.statusCode
    delete response.statusCode

    _.extend(response, {
      // normalize what is an ok status code
      statusText: statusCode.getText(response.status),
      isOkStatusCode: statusCode.isOk(response.status),
      requestHeaders: getOriginalHeaders(req),
      requestBody: req.body,
    })

    // if body is a string and content type is json
    // try to convert the body to JSON
    if (_.isString(response.body) && this.contentTypeIsJson(response)) {
      response.body = this.parseJsonBody(response.body)
    }

    return response
  }

  // TODO: figure out req typings
  private setRequestCookieHeader (req: any, reqUrl: string, automationFn: (automationCommand: string, args: any) => Promise<any>, existingHeader?: string) {
    return automationFn('get:cookies', { url: reqUrl })
    .then((cookies) => {
      debug('got cookies from browser %o', { reqUrl, cookies })
      let header = cookies.map((cookie) => {
        return `${cookie.name}=${cookie.value}`
      }).join('; ') || undefined

      if (header) {
        if (existingHeader) {
          // existingHeader = whatever Cookie header the user is already trying to set
          debug('there is an existing cookie header, merging %o', { header, existingHeader })
          // order does not not matter here
          // @see https://tools.ietf.org/html/rfc6265#section-4.2.2
          header = [existingHeader, header].join(';')
        }

        return caseInsensitiveSet(req.headers, 'Cookie', header)
      }
    })
  }

  private setCookiesOnBrowser (res: IncomingMessage, resUrl: string, automationFn: (automationCommand: string, args: any) => Promise<any>) {
    let cookies = res.headers['set-cookie']

    if (!cookies) {
      return Promise.resolve()
    }

    if (!(cookies instanceof Array)) {
      cookies = [cookies]
    }

    const parsedUrl = url.parse(resUrl)
    const defaultDomain = parsedUrl.hostname as string

    debug('setting cookies on browser %o', { url: parsedUrl.href, defaultDomain, cookies })

    return Promise.map(cookies, (cyCookie) => {
      let cookie = tough.Cookie.parse(cyCookie, { loose: true })

      debug('parsing cookie %o', { cyCookie, toughCookie: cookie })

      if (!cookie) {
        // ignore invalid cookies (same as browser behavior)
        // https://github.com/cypress-io/cypress/issues/6890
        debug('tough-cookie failed to parse, ignoring')

        return
      }

      // @ts-expect-error
      cookie.name = cookie.key

      if (!cookie.domain) {
        // take the domain from the URL
        cookie.domain = defaultDomain
        cookie.hostOnly = true
      }

      if (!tough.domainMatch(defaultDomain, cookie.domain)) {
        debug('domain match failed:', { defaultDomain })

        return
      }

      const expiry = cookie.expiryTime()

      if (isFinite(expiry)) {
        // @ts-expect-error
        cookie.expiry = expiry / 1000
      }

      // @ts-expect-error
      cookie.sameSite = convertSameSiteToughToExtension(cookie.sameSite, cyCookie)

      // @ts-expect-error
      cookie = _.pick(cookie, SERIALIZABLE_COOKIE_PROPS)

      let automationCmd = 'set:cookie'

      if (expiry <= 0) {
        automationCmd = 'clear:cookie'
      }

      return automationFn(automationCmd, cookie)
      .catch((err) => {
        return debug('automation threw an error during cookie change %o', { automationCmd, cyCookie, cookie, err })
      })
    })
  }

  /**
   * currently used by cy.visit() to make the initial document request on behalf of the driver and load it into the buffer (TODO: fill this out)
   * @param headers
   * @param automationFn
   * @param options
   * @returns
   */
  sendStream (headers: { [key: string]: string }, automationFn: (automationCommand: string, args: any) => Promise<any>, opts: Partial<SendStreamOptions> & { url: string }) {
    let ua

    let options = _.defaults(opts, {
      headers: {},
      followAllRedirects: true,
      retryIntervals: [],
      strictSSL: false,
      onBeforeReqInit (fn) {
        return fn()
      },
    })

    if (!caseInsensitiveGet(options.headers, 'user-agent') && (ua = headers['user-agent'])) {
      options.headers['user-agent'] = ua
    }

    // options = _.extend(options, {
    //   strictSSL: false,
    // })

    const self = this

    const {
      followRedirect,
    } = options

    let currentUrl = options.url

    options.followRedirect = function (incomingRes) {
      // TODO: what are the types here?
      // @ts-expect-error
      if (followRedirect && !followRedirect(incomingRes)) {
        return false
      }

      const newUrl = url.resolve(currentUrl, incomingRes.headers.location as string)

      // and when we know we should follow the redirect
      // we need to override the init method and
      // first set the received cookies on the browser
      // and then grab the cookies for the new url
      return self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
      // @ts-expect-error
      .then(() => {
        return self.setRequestCookieHeader(this, newUrl, automationFn)
      }).then(() => {
        currentUrl = newUrl

        return true
      })
    }

    return this.setRequestCookieHeader(options, options.url, automationFn, caseInsensitiveGet(options.headers, 'cookie'))
    .then(() => {
      return () => {
        debug('sending request as stream %o', merge(options))

        // @ts-ignore
        return this.create(options)
      }
    })
  }

  /**
   * currently used by cy.request() to make server requests on behalf of the command
   * @param headers
   * @param automationFn
   * @param options
   * @returns
   */
  sendPromise (headers: { [key: string]: string }, automationFn: (automationCommand: string, args: any) => Promise<any>, opts: Partial<SendPromiseOptions> & { url: string}) {
    let a; let c; let ua

    const options = _.defaults(opts, {
      headers: {},
      gzip: true,
      cookies: true,
      followRedirect: true,
    })

    if (!caseInsensitiveGet(options.headers, 'user-agent') && (ua = headers['user-agent'])) {
      options.headers['user-agent'] = ua
    }

    // normalize case sensitivity
    // to be lowercase
    a = options.headers.Accept

    if (a) {
      delete options.headers.Accept
      options.headers.accept = a
    }

    // https://github.com/cypress-io/cypress/issues/338
    _.defaults(options.headers, {
      accept: '*/*',
    })

    _.extend(options, {
      strictSSL: false,
      simple: false,
      resolveWithFullResponse: true,
    })

    // https://github.com/cypress-io/cypress/issues/322
    // either turn these both on or off
    options.followAllRedirects = options.followRedirect

    if (options.form === true) {
      // reset form to whatever body is
      // and nuke body
      options.form = options.body
      delete options.json
      delete options.body
    }

    // https://github.com/cypress-io/cypress/issues/6178
    if (options.bodyIsBase64Encoded) {
      try {
        debug('body is base64 format: %s', options.body)
        options.body = Buffer.from(options.body, 'base64')
      } catch (e) {
        debug('failed to parse base64 body.')

        throw e
      }

      // These options should be set to send raw Buffer.
      options.encoding = null
      options.json = false
    }

    const self = this

    const send = () => {
      const ms = Date.now()

      const redirects = []
      const requestResponses = []

      const push = (response: IncomingMessage) => {
        // @ts-expect-error
        return requestResponses.push(pick(response))
      }

      let currentUrl = options.url

      if (options.followRedirect) {
        // @ts-expect-error
        options.followRedirect = function (incomingRes: IncomingMessage) {
          const newUrl = url.resolve(currentUrl, incomingRes.headers?.location as string)

          // normalize the url
          // @ts-expect-error
          redirects.push([incomingRes.statusCode, newUrl].join(': '))

          push(incomingRes)

          // and when we know we should follow the redirect
          // we need to override the init method and
          // first set the new cookies on the browser
          // and then grab the cookies for the new url
          return self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
          // @ts-expect-error
          .then(() => {
            return self.setRequestCookieHeader(this, newUrl, automationFn)
          }).then(() => {
            currentUrl = newUrl

            return true
          })
        }
      }

      return this.createRetryingRequestPromise(options)
      .then(this.normalizeResponse.bind(this, push))
      .then((resp) => {
        resp.duration = Date.now() - ms
        resp.allRequestResponses = requestResponses

        if (redirects.length) {
          resp.redirects = redirects
        }

        if ((options.followRedirect === false) && resp.headers.location) {
          // resolve the new location head against
          // the current url
          resp.redirectedToUrl = url.resolve(options.url, resp.headers.location)
        }

        return this.setCookiesOnBrowser(resp, currentUrl, automationFn)
        .return(resp)
      })
    }

    c = options.cookies

    if (c) {
      return self.setRequestCookieHeader(options, options.url, automationFn, caseInsensitiveGet(options.headers, 'cookie'))
      .then(send)
    }

    return send()
  }
}
