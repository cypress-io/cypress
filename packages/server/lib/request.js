const { defaults, pick: pickKeys, uniqueId, getPath } = require('@packages/utils')
let r = require('@cypress/request')
let rp = require('@cypress/request-promise')
const url = require('url')
const tough = require('tough-cookie')
const debug = require('debug')('cypress:server:request')
const Promise = require('bluebird')
const stream = require('stream')
const duplexify = require('duplexify')
const { agent } = require('@packages/network')
const statusCode = require('./util/status_code')
const { streamBuffer } = require('./util/stream_buffer')

const SERIALIZABLE_COOKIE_PROPS = ['name', 'value', 'domain', 'expiry', 'path', 'secure', 'hostOnly', 'httpOnly', 'sameSite']
const NETWORK_ERRORS = 'ECONNREFUSED ECONNRESET EPIPE EHOSTUNREACH EAI_AGAIN ENOTFOUND'.split(' ')
const VERBOSE_REQUEST_OPTS = 'followRedirect strictSSL'.split(' ')
const HTTP_CLIENT_REQUEST_EVENTS = 'abort connect continue information socket timeout upgrade'.split(' ')
const TLS_VERSION_ERROR_RE = /TLSV1_ALERT_PROTOCOL_VERSION|UNSUPPORTED_PROTOCOL/
const SAMESITE_NONE_RE = /; +samesite=(?:'none'|"none"|none)/i

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const convertSameSiteToughToExtension = (sameSite, setCookie) => {
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

  return sameSite
}

const getOriginalHeaders = (req = {}) => {
  // the request instance holds an instance
  // of the original ClientRequest
  // as the 'req' property which holds the
  // original headers else fall back to
  // the normal req.headers
  return getPath(req, 'req.headers') ?? req.headers
}

const getDelayForRetry = function (options = {}) {
  const { err, opts, delaysRemaining, retryIntervals, retryFn, onEnd } = options

  let delay = delaysRemaining.shift()

  if (typeof delay !== 'number') {
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
  if ((delay >= 1000) && (err?.code === 'ECONNREFUSED')) {
    delay = delay / 10
  }

  debug('retrying request %o', merge(opts, {
    delay,
    attempt,
  }))

  return retryFn({ delay, attempt })
}

const hasRetriableStatusCodeFailure = (res, retryOnStatusCodeFailure) => {
  // everything must be true in order to
  // retry a status code failure
  return retryOnStatusCodeFailure && !statusCode.isOk(res.statusCode)
}

const isErrEmptyResponseError = (err) => {
  return err.message.startsWith('ERR_EMPTY_RESPONSE')
}

const isRetriableError = (err = {}, retryOnNetworkFailure) => {
  return retryOnNetworkFailure && NETWORK_ERRORS.includes(err.code)
}

const maybeRetryOnNetworkFailure = function (err, options = {}) {
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
  return getDelayForRetry({
    err,
    opts,
    retryIntervals,
    delaysRemaining,
    retryFn,
    onEnd,
  })
}

const maybeRetryOnStatusCodeFailure = function (res, options = {}) {
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
    headers: pickKeys(res.headers, ['content-type', 'set-cookie', 'location']),
  })

  // is this a retryable status code failure?
  if (!hasRetriableStatusCodeFailure(res, retryOnStatusCodeFailure)) {
    // if not then we're done here
    return onEnd()
  }

  // else see if we have more delays left...
  return getDelayForRetry({
    err,
    opts,
    retryIntervals,
    delaysRemaining,
    retryFn,
    onEnd,
  })
}

const merge = (...args) => {
  const merged = Object.assign({}, ...args)

  for (const key of VERBOSE_REQUEST_OPTS) {
    delete merged[key]
  }

  return merged
}

const pick = function (resp = {}) {
  const req = resp.request != null ? resp.request : {}

  const headers = getOriginalHeaders(req)

  return {
    'Request Body': req.body != null ? req.body : null,
    'Request Headers': headers,
    'Request URL': req.href,
    'Response Body': resp.body != null ? resp.body : null,
    'Response Headers': resp.headers,
    'Response Status': resp.statusCode,
  }
}

const createRetryingRequestPromise = function (opts) {
  const {
    requestId,
    retryIntervals,
    delaysRemaining,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure,
  } = opts

  const retry = ({ delay }) => {
    return Promise.delay(delay)
    .then(() => {
      return createRetryingRequestPromise(opts)
    })
  }

  return rp(opts)
  .catch((err) => {
    // rp wraps network errors in a RequestError, so might need to unwrap it to check
    return maybeRetryOnNetworkFailure(err.error || err, {
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
    return maybeRetryOnStatusCodeFailure(res, {
      opts,
      requestId,
      retryIntervals,
      delaysRemaining,
      retryOnStatusCodeFailure,
      retryFn: retry,
      onEnd: () => res,
    })
  })
}

const pipeEvent = (source, destination, event) => {
  return source.on(event, (...args) => {
    destination.emit(event, ...args)
  })
}

const createRetryingRequestStream = function (opts = {}) {
  const {
    requestId,
    retryIntervals,
    delaysRemaining,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure,
  } = opts

  let req = null

  const delayStream = stream.PassThrough()
  let reqBodyBuffer = streamBuffer()
  const retryStream = duplexify(reqBodyBuffer, delayStream)

  const cleanup = function () {
    if (reqBodyBuffer) {
      // null req body out to free memory
      reqBodyBuffer.unpipeAll()
      reqBodyBuffer = null
    }
  }

  const emitError = function (err) {
    retryStream.emit('error', err)

    cleanup()
  }

  const tryStartStream = function () {
    // if our request has been aborted
    // in the time that we were waiting to retry
    // then immediately bail
    if (retryStream.aborted) {
      return
    }

    const reqStream = r(opts)
    let didReceiveResponse = false

    const retry = function ({ delay, attempt }) {
      retryStream.emit('retry', { attempt, delay })

      return setTimeout(tryStartStream, delay)
    }

    // if we're retrying and we previous piped
    // into the reqStream, then reapply this now
    if (req) {
      reqStream.emit('pipe', req)
      reqBodyBuffer.createReadStream().pipe(reqStream)
    }

    // forward the abort call to the underlying request
    retryStream.abort = function () {
      debug('aborting', { requestId })
      retryStream.aborted = true

      reqStream.abort()
    }

    const onPiped = function (src) {
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

    reqStream.on('error', (err) => {
      if (didReceiveResponse) {
        // if we've already begun processing the requests
        // response, then that means we failed during transit
        // and its no longer safe to retry. all we can do now
        // is propagate the error upwards
        debug('received an error on request after response started %o', merge(opts, { err }))

        return emitError(err)
      }

      // otherwise, see if we can retry another request under the hood...
      return maybeRetryOnNetworkFailure(err, {
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

    reqStream.once('response', (incomingRes) => {
      didReceiveResponse = true

      // ok, no net error, but what about a bad status code?
      return maybeRetryOnStatusCodeFailure(incomingRes, {
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
          return HTTP_CLIENT_REQUEST_EVENTS.map((event) => pipeEvent(reqStream, retryStream, event))
        },
      })
    })
  }

  tryStartStream()

  return retryStream
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

const setDefaults = (opts) => {
  defaults(opts, {
    requestId: uniqueId('request'),
    retryIntervals: [],
    retryOnNetworkFailure: true,
    retryOnStatusCodeFailure: false,
  })

  defaults(opts, {
    delaysRemaining: [...opts.retryIntervals],
  })

  return opts
}

module.exports = function (options = {}) {
  const requestDefaults = {
    timeout: options.timeout,
    agent,
    // send keep-alive with requests since Chrome won't send it in proxy mode
    // https://github.com/cypress-io/cypress/pull/3531#issuecomment-476269041
    headers: {
      'Connection': 'keep-alive',
    },
    proxy: null, // upstream proxying is handled by CombinedAgent
  }

  r = r.defaults(requestDefaults)
  rp = rp.defaults(requestDefaults)

  return {
    r: require('@cypress/request'),

    rp: require('@cypress/request-promise'),

    getDelayForRetry,

    setDefaults,

    create (strOrOpts, promise) {
      let opts

      if (typeof strOrOpts === 'string') {
        opts = {
          url: strOrOpts,
        }
      } else {
        opts = strOrOpts
      }

      opts = setDefaults(opts)

      if (promise) {
        return createRetryingRequestPromise(opts)
      }

      return createRetryingRequestStream(opts)
    },

    contentTypeIsJson (response) {
      // TODO: use https://github.com/jshttp/type-is for this
      // https://github.com/cypress-io/cypress/pull/5166
      if (response && response.headers && response.headers['content-type']) {
        return response.headers['content-type'].split(';', 2)[0].endsWith('json')
      }
    },

    parseJsonBody (body) {
      try {
        return JSON.parse(body)
      } catch (e) {
        return body
      }
    },

    normalizeResponse (push, response) {
      const req = response.request != null ? response.request : {}

      push(response)

      const picked = {}

      for (const key of ['statusCode', 'body', 'headers']) {
        if (key in response) {
          picked[key] = response[key]
        }
      }

      response = picked

      // normalize status
      response.status = response.statusCode
      delete response.statusCode

      Object.assign(response, {
        // normalize what is an ok status code
        statusText: statusCode.getText(response.status),
        isOkStatusCode: statusCode.isOk(response.status),
        requestHeaders: getOriginalHeaders(req),
        requestBody: req.body,
      })

      // if body is a string and content type is json
      // try to convert the body to JSON
      if (typeof response.body === 'string' && this.contentTypeIsJson(response)) {
        response.body = this.parseJsonBody(response.body)
      }

      return response
    },

    setRequestCookieHeader (req, reqUrl, automationFn, existingHeader) {
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
    },

    setCookiesOnBrowser (res, resUrl, automationFn) {
      let cookies = res.headers['set-cookie']

      if (!cookies) {
        return Promise.resolve()
      }

      if (!(cookies instanceof Array)) {
        cookies = [cookies]
      }

      const parsedUrl = url.parse(resUrl)
      const defaultDomain = parsedUrl.hostname

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
          cookie.expiry = expiry / 1000
        }

        cookie.sameSite = convertSameSiteToughToExtension(cookie.sameSite, cyCookie)

        cookie = pickKeys(cookie, SERIALIZABLE_COOKIE_PROPS)

        let automationCmd = 'set:cookie'

        if (expiry <= 0) {
          automationCmd = 'clear:cookie'
        }

        return automationFn(automationCmd, cookie)
        .catch((err) => {
          return debug('automation threw an error during cookie change %o', { automationCmd, cyCookie, cookie, err })
        })
      })
    },

    sendStream (userAgent, automationFn, options = {}) {
      defaults(options, {
        headers: {},
        followAllRedirects: true,
        onBeforeReqInit (fn) {
          return fn()
        },
      })

      if (!caseInsensitiveGet(options.headers, 'user-agent') && userAgent) {
        options.headers['user-agent'] = userAgent
      }

      Object.assign(options, {
        strictSSL: false,
      })

      const self = this

      const {
        followRedirect,
      } = options

      let currentUrl = options.url

      options.followRedirect = function (incomingRes) {
        if (followRedirect && !followRedirect(incomingRes)) {
          return false
        }

        const newUrl = url.resolve(currentUrl, incomingRes.headers.location)

        // and when we know we should follow the redirect
        // we need to override the init method and
        // first set the received cookies on the browser
        // and then grab the cookies for the new url
        return self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
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

          return this.create(options)
        }
      })
    },

    sendPromise (userAgent, automationFn, options = {}) {
      defaults(options, {
        headers: {},
        gzip: true,
        cookies: true,
        followRedirect: true,
      })

      if (!caseInsensitiveGet(options.headers, 'user-agent') && userAgent) {
        options.headers['user-agent'] = userAgent
      }

      // normalize case sensitivity
      // to be lowercase
      let accept = options.headers.Accept

      if (accept) {
        delete options.headers.Accept
        options.headers.accept = accept
      }

      // https://github.com/cypress-io/cypress/issues/338
      defaults(options.headers, {
        accept: '*/*',
      })

      Object.assign(options, {
        strictSSL: false,
        simple: false,
        resolveWithFullResponse: true,
      })

      // https://github.com/cypress-io/cypress/issues/322
      // either turn these both on or off
      options.followAllRedirects = options.followRedirect

      // https://github.com/cypress-io/cypress/issues/28789
      if (options.json === true) {
        if (typeof options.body === 'boolean' || options.body === null) options.body = String(options.body)
      }

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

        const push = (response) => {
          return requestResponses.push(pick(response))
        }

        let currentUrl = options.url

        if (options.followRedirect) {
          options.followRedirect = function (incomingRes) {
            const newUrl = url.resolve(currentUrl, incomingRes.headers.location)

            // normalize the url
            redirects.push([incomingRes.statusCode, newUrl].join(': '))

            push(incomingRes)

            // and when we know we should follow the redirect
            // we need to override the init method and
            // first set the new cookies on the browser
            // and then grab the cookies for the new url
            return self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
            .then(() => {
              return self.setRequestCookieHeader(this, newUrl, automationFn)
            }).then(() => {
              currentUrl = newUrl

              return true
            })
          }
        }

        return this.create(options, true)
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

      if (options.cookies) {
        return self.setRequestCookieHeader(options, options.url, automationFn, caseInsensitiveGet(options.headers, 'cookie'))
        .then(send)
      }

      return send()
    },

  }
}
