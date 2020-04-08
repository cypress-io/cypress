_          = require("lodash")
r          = require("@cypress/request")
rp         = require("@cypress/request-promise")
url        = require("url")
tough      = require("tough-cookie")
debug      = require("debug")("cypress:server:request")
Promise    = require("bluebird")
stream     = require("stream")
duplexify  = require("duplexify")
agent      = require("@packages/network").agent
statusCode = require("./util/status_code")
streamBuffer = require("./util/stream_buffer").streamBuffer

SERIALIZABLE_COOKIE_PROPS = ['name', 'value', 'domain', 'expiry', 'path', 'secure', 'hostOnly', 'httpOnly', 'sameSite']
NETWORK_ERRORS = "ECONNREFUSED ECONNRESET EPIPE EHOSTUNREACH EAI_AGAIN ENOTFOUND".split(" ")
VERBOSE_REQUEST_OPTS = "followRedirect strictSSL".split(" ")
HTTP_CLIENT_REQUEST_EVENTS = "abort connect continue information socket timeout upgrade".split(" ")
TLS_VERSION_ERROR_RE =  /TLSV1_ALERT_PROTOCOL_VERSION|UNSUPPORTED_PROTOCOL/
SAMESITE_NONE_RE = /; +samesite=(?:'none'|"none"|none)/i

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

convertSameSiteToughToExtension = (sameSite, setCookie) =>
  ## tough-cookie@4.0.0 uses 'none' as a default, so run this regex to detect if
  ## SameSite=None was not explicitly set
  ## @see https://github.com/salesforce/tough-cookie/issues/191
  isUnspecified = sameSite is "none" and !SAMESITE_NONE_RE.test(setCookie)

  if isUnspecified
    ## not explicitly set, so fall back to the browser's default
    return undefined

  if sameSite is 'none'
    return 'no_restriction'

  return sameSite

getOriginalHeaders = (req = {}) ->
  ## the request instance holds an instance
  ## of the original ClientRequest
  ## as the 'req' property which holds the
  ## original headers else fall back to
  ## the normal req.headers
  _.get(req, 'req.headers', req.headers)

getDelayForRetry = (options = {}) ->
  { err, opts, delaysRemaining, retryIntervals, onNext, onElse } = options

  delay = delaysRemaining.shift()

  if not _.isNumber(delay)
    ## no more delays, bailing
    debug("exhausted all attempts retrying request %o", merge(opts, { err }))

    return onElse()

  ## figure out which attempt we're on...
  attempt = retryIntervals.length - delaysRemaining.length

  ## if this ECONNREFUSED and we are
  ## retrying greater than 1 second
  ## then divide the delay interval
  ## by 10 so it doesn't wait as long to retry
  ## TODO: do we really want to do this?
  if delay >= 1000 and _.get(err, "code") is "ECONNREFUSED"
    delay = delay / 10

  debug("retrying request %o", merge(opts, {
    delay,
    attempt,
  }))

  return onNext(delay, attempt)

hasRetriableStatusCodeFailure = (res, retryOnStatusCodeFailure) ->
  ## everything must be true in order to
  ## retry a status code failure
  _.every([
    retryOnStatusCodeFailure,
    !statusCode.isOk(res.statusCode)
  ])

isRetriableError = (err = {}, retryOnNetworkFailure) ->
  _.every([
    retryOnNetworkFailure,
    _.includes(NETWORK_ERRORS, err.code)
  ])

maybeRetryOnNetworkFailure = (err, options = {}) ->
  {
    opts,
    retryIntervals,
    delaysRemaining,
    retryOnNetworkFailure,
    onNext,
    onElse,
  } = options

  debug("received an error making http request %o", merge(opts, { err }))

  isTlsVersionError = TLS_VERSION_ERROR_RE.test(err.message)

  if isTlsVersionError
    ## because doing every connection via TLSv1 can lead to slowdowns, we set it only on failure
    ## https://github.com/cypress-io/cypress/pull/6705
    debug('detected TLS version error, setting min version to TLSv1')
    opts.minVersion = 'TLSv1'

  if not isTlsVersionError and not isRetriableError(err, retryOnNetworkFailure)
    return onElse()

  ## else see if we have more delays left...
  getDelayForRetry({
    err,
    opts,
    retryIntervals,
    delaysRemaining,
    onNext,
    onElse,
  })

maybeRetryOnStatusCodeFailure = (res, options = {}) ->
  {
    err,
    opts,
    requestId,
    retryIntervals,
    delaysRemaining,
    retryOnStatusCodeFailure,
    onNext,
    onElse,
  } = options

  debug("received status code & headers on request %o", {
    requestId,
    statusCode: res.statusCode,
    headers: _.pick(res.headers, 'content-type', 'set-cookie', 'location')
  })

  ## is this a retryable status code failure?
  if not hasRetriableStatusCodeFailure(res, retryOnStatusCodeFailure)
    ## if not then we're done here
    return onElse()

  ## else see if we have more delays left...
  getDelayForRetry({
    err,
    opts,
    retryIntervals,
    delaysRemaining,
    onNext,
    onElse,
  })

merge = (args...) ->
  _.chain({})
  .extend(args...)
  .omit(VERBOSE_REQUEST_OPTS)
  .value()

pick = (resp = {}) ->
  req = resp.request ? {}

  headers = getOriginalHeaders(req)

  {
    "Request Body":     req.body ? null
    "Request Headers":  headers
    "Request URL":      req.href
    "Response Body":    resp.body ? null
    "Response Headers": resp.headers
    "Response Status":  resp.statusCode
  }

createRetryingRequestPromise = (opts) ->
  {
    requestId,
    retryIntervals,
    delaysRemaining,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure
  } = opts

  retry = (delay) ->
    return Promise.delay(delay)
    .then ->
      createRetryingRequestPromise(opts)

  return rp(opts)
  .catch (err) ->

    ## rp wraps network errors in a RequestError, so might need to unwrap it to check
    maybeRetryOnNetworkFailure(err.error or err, {
      opts,
      retryIntervals,
      delaysRemaining,
      retryOnNetworkFailure,
      onNext: retry
      onElse: ->
        throw err
    })
  .then (res) ->
    ## ok, no net error, but what about a bad status code?
    maybeRetryOnStatusCodeFailure(res, {
      opts,
      requestId,
      retryIntervals,
      delaysRemaining,
      retryOnStatusCodeFailure,
      onNext: retry
      onElse: _.constant(res)
    })

pipeEvent = (source, destination, event) ->
  source.on event, (args...) ->
    destination.emit(event, args...)

createRetryingRequestStream = (opts = {}) ->
  {
    requestId,
    retryIntervals,
    delaysRemaining,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure
  } = opts

  req = null

  delayStream = stream.PassThrough()
  reqBodyBuffer = streamBuffer()
  retryStream = duplexify(reqBodyBuffer, delayStream)

  cleanup = ->
    if reqBodyBuffer
      ## null req body out to free memory
      reqBodyBuffer.unpipeAll()
      reqBodyBuffer = null

  emitError = (err) ->
    retryStream.emit("error", err)

    cleanup()

  tryStartStream = ->
    ## if our request has been aborted
    ## in the time that we were waiting to retry
    ## then immediately bail
    if retryStream.aborted
      return

    reqStream = r(opts)
    didReceiveResponse = false

    retry = (delay, attempt) ->
      retryStream.emit("retry", { attempt, delay })

      setTimeout(tryStartStream, delay)

    ## if we're retrying and we previous piped
    ## into the reqStream, then reapply this now
    if req
      reqStream.emit('pipe', req)
      reqBodyBuffer.createReadStream().pipe(reqStream)

    ## forward the abort call to the underlying request
    retryStream.abort = ->
      debug('aborting', { requestId })
      retryStream.aborted = true

      reqStream.abort()

    onPiped = (src) ->
      ## store this IncomingMessage so we can reapply it
      ## if we need to retry
      req = src

      ## https://github.com/request/request/blob/b3a218dc7b5689ce25be171e047f0d4f0eef8919/request.js#L493
      ## the request lib expects this 'pipe' event in
      ## order to copy the request headers onto the
      ## outgoing message - so we manually pipe it here
      src.pipe(reqStream)

    ## when this passthrough stream is being piped into
    ## then make sure we properly "forward" and connect
    ## forward it to the real reqStream which enables
    ## request to read off the IncomingMessage readable stream
    retryStream.once("pipe", onPiped)

    reqStream.on "error", (err) ->
      if didReceiveResponse
        ## if we've already begun processing the requests
        ## response, then that means we failed during transit
        ## and its no longer safe to retry. all we can do now
        ## is propogate the error upwards
        debug("received an error on request after response started %o", merge(opts, { err }))

        return emitError(err)

      ## otherwise, see if we can retry another request under the hood...
      maybeRetryOnNetworkFailure(err, {
        opts,
        retryIntervals,
        delaysRemaining,
        retryOnNetworkFailure,
        onNext: retry
        onElse: ->
          emitError(err)
      })

    reqStream.once "request", (req) ->
      ## remove the pipe listener since once the request has
      ## been made, we cannot pipe into the reqStream anymore
      retryStream.removeListener("pipe", onPiped)

    reqStream.once "response", (incomingRes) ->
      didReceiveResponse = true

      ## ok, no net error, but what about a bad status code?
      maybeRetryOnStatusCodeFailure(incomingRes, {
        opts,
        requestId,
        delaysRemaining,
        retryIntervals,
        retryOnStatusCodeFailure,
        onNext: retry
        onElse: ->
          debug("successful response received", { requestId })

          cleanup()

          ## forward the response event upwards which should happen
          ## prior to the pipe event, same as what request does
          ## https://github.com/request/request/blob/master/request.js#L1059
          retryStream.emit("response", incomingRes)

          reqStream.pipe(delayStream)

          ## `http.ClientRequest` events
          _.map(HTTP_CLIENT_REQUEST_EVENTS, _.partial(pipeEvent, reqStream, retryStream))
      })

  tryStartStream()

  return retryStream

caseInsensitiveGet = (obj, property) ->
  lowercaseProperty = property.toLowerCase()

  for key in Object.keys(obj)
    if key.toLowerCase() == lowercaseProperty
      return obj[key]

## first, attempt to set on an existing property with differing case
## if that fails, set the lowercase `property`
caseInsensitiveSet = (obj, property, val) ->
  lowercaseProperty = property.toLowerCase()

  for key in Object.keys(obj)
    if key.toLowerCase() == lowercaseProperty
      return obj[key] = val

  obj[lowercaseProperty] = val

setDefaults = (opts) ->
  _
  .chain(opts)
  .defaults({
    requestId: _.uniqueId('request')
    retryIntervals: [0, 1000, 2000, 2000]
    retryOnNetworkFailure: true
    retryOnStatusCodeFailure: false
  })
  .thru (opts) ->
    _.defaults(opts, {
      delaysRemaining: _.clone(opts.retryIntervals)
    })
  .value()

module.exports = (options = {}) ->
  defaults = {
    timeout: options.timeout
    agent: agent
    ## send keep-alive with requests since Chrome won't send it in proxy mode
    ## https://github.com/cypress-io/cypress/pull/3531#issuecomment-476269041
    headers: {
      "Connection": "keep-alive"
    }
    proxy: null ## upstream proxying is handled by CombinedAgent
  }

  r  = r.defaults(defaults)
  rp = rp.defaults(defaults)

  return {
    r: require("@cypress/request")

    rp: require("@cypress/request-promise")

    getDelayForRetry

    setDefaults

    create: (strOrOpts, promise) ->
      switch
        when _.isString(strOrOpts)
          opts = {
            url: strOrOpts
          }
        else
          opts = strOrOpts

      opts = setDefaults(opts)

      if promise
        createRetryingRequestPromise(opts)
      else
        createRetryingRequestStream(opts)

    contentTypeIsJson: (response) ->
      ## TODO: use https://github.com/jshttp/type-is for this
      ## https://github.com/cypress-io/cypress/pull/5166
      response?.headers?["content-type"]?.split(';', 2)[0].endsWith("json")

    parseJsonBody: (body) ->
      try
        JSON.parse(body)
      catch e
        body

    normalizeResponse: (push, response) ->
      req = response.request ? {}

      push(response)

      response = _.pick(response, "statusCode", "body", "headers")

      ## normalize status
      response.status = response.statusCode
      delete response.statusCode

      _.extend(response, {
        ## normalize what is an ok status code
        statusText:     statusCode.getText(response.status)
        isOkStatusCode: statusCode.isOk(response.status)
        requestHeaders: getOriginalHeaders(req)
        requestBody:    req.body
      })

      ## if body is a string and content type is json
      ## try to convert the body to JSON
      if _.isString(response.body) and @contentTypeIsJson(response)
        response.body = @parseJsonBody(response.body)

      return response

    setRequestCookieHeader: (req, reqUrl, automationFn, existingHeader) ->
      automationFn('get:cookies', { url: reqUrl })
      .then (cookies) ->
        debug('got cookies from browser %o', { reqUrl, cookies })
        header = cookies.map (cookie) ->
          "#{cookie.name}=#{cookie.value}"
        .join("; ") || undefined

        if header
          if existingHeader
            ## existingHeader = whatever Cookie header the user is already trying to set
            debug('there is an existing cookie header, merging %o', { header, existingHeader })
            ## order does not not matter here
            ## @see https://tools.ietf.org/html/rfc6265#section-4.2.2
            header = [existingHeader, header].join(';')

          caseInsensitiveSet(req.headers, 'Cookie', header)

    setCookiesOnBrowser: (res, resUrl, automationFn) ->
      cookies = res.headers['set-cookie']
      if !cookies
        return Promise.resolve()

      if !(cookies instanceof Array)
        cookies = [cookies]

      parsedUrl = url.parse(resUrl)
      defaultDomain = parsedUrl.hostname

      debug('setting cookies on browser %o', { url: parsedUrl.href, defaultDomain, cookies })

      Promise.map cookies, (cyCookie) ->
        cookie = tough.Cookie.parse(cyCookie, { loose: true })

        debug('parsing cookie %o', { cyCookie, toughCookie: cookie })

        if not cookie
          ## ignore invalid cookies (same as browser behavior)
          ## https://github.com/cypress-io/cypress/issues/6890
          debug('tough-cookie failed to parse, ignoring')
          return

        cookie.name = cookie.key

        if not cookie.domain
          ## take the domain from the URL
          cookie.domain = defaultDomain
          cookie.hostOnly = true

        if not tough.domainMatch(defaultDomain, cookie.domain)
          debug('domain match failed:', { defaultDomain })
          return

        expiry = cookie.expiryTime()
        if isFinite(expiry)
          cookie.expiry = expiry / 1000

        cookie.sameSite = convertSameSiteToughToExtension(cookie.sameSite, cyCookie)

        cookie = _.pick(cookie, SERIALIZABLE_COOKIE_PROPS)

        automationCmd = 'set:cookie'

        if expiry <= 0
          automationCmd = 'clear:cookie'

        automationFn(automationCmd, cookie)
        .catch (err) ->
          debug('automation threw an error during cookie change %o', { automationCmd, cyCookie, cookie, err })

    sendStream: (headers, automationFn, options = {}) ->
      _.defaults options, {
        headers: {}
        onBeforeReqInit: (fn) -> fn()
      }

      if not caseInsensitiveGet(options.headers, "user-agent") and (ua = headers["user-agent"])
        options.headers["user-agent"] = ua

      _.extend options, {
        strictSSL: false
      }

      self = @

      followRedirect = options.followRedirect

      currentUrl = options.url

      options.followRedirect = (incomingRes) ->
        if followRedirect and not followRedirect(incomingRes)
          return false

        newUrl = url.resolve(currentUrl, incomingRes.headers.location)

        ## and when we know we should follow the redirect
        ## we need to override the init method and
        ## first set the received cookies on the browser
        ## and then grab the cookies for the new url
        self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
        .then (cookies) =>
          self.setRequestCookieHeader(@, newUrl, automationFn)
        .then =>
          currentUrl = newUrl
          true

      @setRequestCookieHeader(options, options.url, automationFn, caseInsensitiveGet(options.headers, 'cookie'))
      .then =>
        return =>
          debug("sending request as stream %o", merge(options))

          @create(options)

    sendPromise: (headers, automationFn, options = {}) ->
      _.defaults options, {
        headers: {}
        gzip: true
        cookies: true
        followRedirect: true
      }

      if not caseInsensitiveGet(options.headers, "user-agent") and (ua = headers["user-agent"])
        options.headers["user-agent"] = ua

      ## normalize case sensitivity
      ## to be lowercase
      if a = options.headers.Accept
        delete options.headers.Accept
        options.headers.accept = a

      ## https://github.com/cypress-io/cypress/issues/338
      _.defaults(options.headers, {
        accept: "*/*"
      })

      _.extend(options, {
        strictSSL: false
        simple: false
        resolveWithFullResponse: true
      })

      ## https://github.com/cypress-io/cypress/issues/322
      ## either turn these both on or off
      options.followAllRedirects = options.followRedirect

      if options.form is true
        ## reset form to whatever body is
        ## and nuke body
        options.form = options.body
        delete options.json
        delete options.body

      self             = @

      send = =>
        ms = Date.now()

        redirects        = []
        requestResponses = []

        push = (response) ->
          requestResponses.push(pick(response))

        currentUrl = options.url

        if options.followRedirect
          options.followRedirect = (incomingRes) ->
            newUrl = url.resolve(currentUrl, incomingRes.headers.location)

            ## normalize the url
            redirects.push([incomingRes.statusCode, newUrl].join(": "))

            push(incomingRes)

            ## and when we know we should follow the redirect
            ## we need to override the init method and
            ## first set the new cookies on the browser
            ## and then grab the cookies for the new url
            self.setCookiesOnBrowser(incomingRes, currentUrl, automationFn)
            .then =>
              self.setRequestCookieHeader(@, newUrl, automationFn)
            .then =>
              currentUrl = newUrl
              true

        @create(options, true)
        .then(@normalizeResponse.bind(@, push))
        .then (resp) =>
          ## TODO: move duration somewhere...?
          ## does node store this somewhere?
          ## we could probably calculate this ourselves
          ## by using the date headers
          resp.duration            = Date.now() - ms
          resp.allRequestResponses = requestResponses

          if redirects.length
            resp.redirects = redirects

          if options.followRedirect is false and (loc = resp.headers.location)
            ## resolve the new location head against
            ## the current url
            resp.redirectedToUrl = url.resolve(options.url, loc)

          @setCookiesOnBrowser(resp, currentUrl, automationFn)
          .return(resp)

      if c = options.cookies
        self.setRequestCookieHeader(options, options.url, automationFn, caseInsensitiveGet(options.headers, 'cookie'))
        .then(send)
      else
        send()

  }
