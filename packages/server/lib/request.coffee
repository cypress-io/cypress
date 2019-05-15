_          = require("lodash")
r          = require("request")
rp         = require("request-promise")
url        = require("url")
tough      = require("tough-cookie")
debug      = require("debug")("cypress:server:request")
moment     = require("moment")
Promise    = require("bluebird")
stream     = require("stream")
duplexify  = require("duplexify")
agent      = require("@packages/network").agent
statusCode = require("./util/status_code")
streamBuffer = require("./util/stream_buffer").streamBuffer
Cookies    = require("./automation/cookies")

Cookie    = tough.Cookie
CookieJar = tough.CookieJar

## shallow clone the original
serializableProperties = Cookie.serializableProperties.slice(0)

NETWORK_ERRORS = "ECONNREFUSED ECONNRESET EPIPE EHOSTUNREACH EAI_AGAIN".split(" ")
HTTP_CLIENT_REQUEST_EVENTS = "abort connect continue information socket timeout upgrade".split(" ")

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

getOriginalHeaders = (req = {}) ->
  ## the request instance holds an instance
  ## of the original ClientRequest
  ## as the 'req' property which holds the
  ## original headers else fall back to
  ## the normal req.headers
  _.get(req, 'req.headers', req.headers)

getDelayForRetry = (intervals, err) ->
  if not intervals.length
    return

  delay = intervals.pop()

  ## if this ECONNREFUSED and we are
  ## retrying greater than 1 second
  ## then divide the delay interval
  ## by 100 so it doesn't wait as long to retry
  ## TODO: do we really want to do this?
  if delay >= 1000 and _.get(err, "code") is "ECONNREFUSED"
    delay = delay / 100

  return delay

hasRetriableStatusCodeFailure = (res, opts) ->
  ## everything must be true in order to
  ## retry a status code failure
  _.every([
    opts.retryOnStatusCodeFailure,
    !statusCode.isOk(res.statusCode)
  ])

isRetriableError = (err = {}, retryOnNetworkFailure) ->
  _.every([
    retryOnNetworkFailure,
    _.includes(NETWORK_ERRORS, err.code)
  ])

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

setCookies = (cookies, jar, headers, url) =>
  return if _.isEmpty(cookies)

  if jar
    cookies.forEach (c) ->
      jar.setCookie(c, url, {ignoreError: true})

  else
    headers.Cookie = createCookieString(cookies)

newCookieJar = ->
  j = new CookieJar(undefined, {looseMode: true})

  ## match the same api signature as @request
  {
    _jar: j

    toJSON: ->
      ## temporarily include the URL property
      ## and restore afterwards. this is used to fix
      ## https://github.com/cypress-io/cypress/issues/1321
      Cookie.serializableProperties = serializableProperties.concat("url")
      cookies = j.toJSON()
      Cookie.serializableProperties = serializableProperties
      return cookies

    setCookie: (cookieOrStr, uri, options) ->
      ## store the original URL this cookie was set on
      if cookie = j.setCookieSync(cookieOrStr, uri, options)
        ## only set cookie URL if it was created correctly
        ## since servers may send invalid cookies that fail
        ## to parse - we may get undefined here
        cookie.url = uri

      return cookie

    getCookieString: (uri) ->
      j.getCookieStringSync(uri, {expire: false})

    getCookies: (uri) ->
      j.getCookiesSync(uri, {expire: false})
  }

convertToJarCookie = (cookies = []) ->
  _.map cookies, (cookie) ->
    props = {
      key:      cookie.name
      path:     cookie.path
      value:    cookie.value
      secure:   cookie.secure
      httpOnly: cookie.httpOnly
      hostOnly: cookie.hostOnly
    }

    ## hostOnly is the default when
    ## NO DOMAIN= attribute was set
    ##
    ## so if we are not hostOnly then
    ## this cookie WAS created with
    ## a Domain= attribute and therefore
    ## which lessens whichs domains this
    ## cookie may be sent, and therefore
    ## we need to set props.domain else
    ## the domain would be implied by URL
    if not cookie.hostOnly
      ## https://github.com/salesforce/tough-cookie/issues/26
      ## we need to strip the leading dot
      ## on domains else tough cookie will not
      ## properly send these cookies.
      ## we get dot leading domains from the
      ## chrome cookie API's
      props.domain = _.trimStart(cookie.domain, ".")

    ## if we have an expiry then this
    ## is the number of seconds since the epoch
    ## that this cookie expires. we need to convert
    ## this to a JS date object
    if cookie.expiry?
      props.expires = moment.unix(cookie.expiry).toDate()

    return new Cookie(props)

reduceCookieToArray = (c) ->
  _.reduce c, (memo, val, key) ->
    memo.push [key.trim(), val.trim()].join("=")
    memo
  , []

createCookieString = (c) ->
  reduceCookieToArray(c).join("; ")

createRetryingRequestPromise = (opts) ->
  {
    requestId,
    retryIntervals,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure
  } = opts

  intervals = _.clone(retryIntervals)

  retry = (delay) ->
    attempt = retryIntervals.length - intervals.length

    debug("retrying request %o", {
      requestId
      attempt
      delay
      opts
    })

    return Promise.delay(delay)
    .then ->
      createRetryingRequestPromise(opts)

  return rp(opts)
  .catch (err) ->
    debug("received an error making http request %o", { requestId, opts, err })

    ## rp wraps network errors in a RequestError, so might need to unwrap it to check
    if not isRetriableError(err.error || err, retryOnNetworkFailure)
      throw err

    delay = getDelayForRetry(intervals, err)

    if not _.isNumber(delay)
      debug("exhausted all attempts retrying request %o", {
        requestId,
        err,
        opts,
      })

      throw err

    return retry(delay)
  .then (res) ->
    ## ok, no net error, but what about a bad status code?
    if hasRetriableStatusCodeFailure(res, retryOnStatusCodeFailure)
      delay = getDelayForRetry(intervals, err)

      if _.isNumber(delay)
        debug("received failing status code on res, retrying %o", {
          requestId,
          statusCode: res.statusCode
        })

      return retry(delay)

    return res

pipeEvent = (source, destination, event) ->
  source.on event, (args...) ->
    destination.emit(event, args...)

createRetryingRequestStream = (opts = {}) ->
  {
    requestId,
    retryIntervals,
    retryOnNetworkFailure,
    retryOnStatusCodeFailure
  } = opts

  req = null
  didAbort = false
  intervals = _.clone(retryIntervals)

  delayStream = stream.PassThrough()
  reqBodyBuffer = streamBuffer()
  retryStream = duplexify(reqBodyBuffer, delayStream)

  emitError = (err) ->
    retryStream.emit("error", err)

    ## TODO: we probably want to destroy
    ## the stream, but leaving in the error emit
    ## temporarily until we finish implementation
    # retryStream.destroy(err)

  tryStartStream = ->
    ## if our request has been aborted
    ## in the time that we were waiting to retry
    ## then immediately bail
    if didAbort
      return

    reqStream = r(opts)
    didReceiveResponse = false

    retry = (delay) ->
      attempt = retryIntervals.length - intervals.length

      debug("retrying request %o", {
        requestId
        attempt
        delay
        opts
      })

      retryStream.emit("retry", { attempt, delay })

      setTimeout(tryStartStream, delay)

    ## if we're retrying and we previous piped
    ## into the reqStream, then reapply this now
    if req
      reqStream.emit('pipe', req)
      reqBodyBuffer.reader().pipe(reqStream)

    ## forward the abort call to the underlying request
    retryStream.abort = ->
      debug('aborting', { requestId })
      didAbort = true

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
        debug("received an error on request after response started %o", { requestId, opts, err })

        return emitError(err)

      ## otherwise, see if we can retry another request under the hood...
      debug("received an error making http request %o", { requestId, opts, err })

      if not isRetriableError(err, retryOnNetworkFailure)
        return emitError(err)

      delay = getDelayForRetry(intervals, err)

      if not _.isNumber(delay)
        debug("exhausted all attempts retrying request %o", {
          requestId,
          err,
          opts,
        })

        return emitError(err)

      return retry(delay)

    reqStream.once "request", (req) ->
      ## remove the pipe listener since once the request has
      ## been made, we cannot pipe into the reqStream anymore
      retryStream.removeListener("pipe", onPiped)

    reqStream.once "response", (incomingRes) ->
      didReceiveResponse = true

      ## ok, no net error, but what about a bad status code?
      if hasRetriableStatusCodeFailure(incomingRes, retryOnStatusCodeFailure)
        delay = getDelayForRetry(intervals, err)

        if _.isNumber(delay)
          debug("received failing status code on res, retrying %o", {
            requestId,
            statusCode: res.statusCode
          })

        return retry(delay)

      debug("successful response received", { requestId })

      ## null req body out to free memory
      reqBodyBuffer.unpipeAll()
      reqBodyBuffer = null

      ## forward the response event upwards which should happen
      ## prior to the pipe event, same as what request does
      ## https://github.com/request/request/blob/master/request.js#L1059
      retryStream.emit("response", incomingRes)

      reqStream.pipe(delayStream)

      ## `http.ClientRequest` events
      _.map(HTTP_CLIENT_REQUEST_EVENTS, _.partial(pipeEvent, reqStream, retryStream))

  tryStartStream()

  return retryStream

caseInsensitiveGet = (obj, property) ->
  lowercaseProperty = property.toLowerCase()

  for key in Object.keys(obj)
    if key.toLowerCase() == lowercaseProperty
      return obj[key]

module.exports = (options = {}) ->
  defaults = {
    timeout: options.timeout ? 20000
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
    r: require("request")

    rp: require("request-promise")

    reduceCookieToArray: reduceCookieToArray

    createCookieString: createCookieString

    create: (strOrOpts, promise) ->
      switch
        when _.isString(strOrOpts)
          opts = {
            url: strOrOpts
          }
        else
          opts = strOrOpts

      _.defaults(opts, {
        requestId: _.uniqueId('request')
        retryIntervals: [0, 1000, 2000, 2000]
        retryOnNetworkFailure: true
        retryOnStatusCodeFailure: false
      })

      if promise
        createRetryingRequestPromise(opts)
      else
        createRetryingRequestStream(opts)

    contentTypeIsJson: (response) ->
      ## TODO: use https://github.com/jshttp/type-is for this
      response?.headers?["content-type"]?.includes("application/json")

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

    setJarCookies: (jar, automationFn) ->
      setCookie = (cookie) ->
        cookie.name = cookie.key

        ## TODO: fix this
        return if cookie.name and cookie.name.startsWith("__cypress")

        ## tough-cookie will return us a cookie that looks like this....
        # { key: 'secret-session',
        #   value: 's%3AxMYoMAXnnMN2pzjYKJx21Id9zjQOaPsT.aKJv1mlfNlCEtrPUjgt48KX0c7xNiB%2Bb0fLijmi48dY',
        #   domain: 'session.foobar.com',
        #   path: '/',
        #   httpOnly: true,
        #   extensions: [ 'SameSite=Strict' ],
        #   hostOnly: true,
        #   creation: '2016-09-04T18:48:06.882Z',
        #   lastAccessed: '2016-09-04T18:48:06.882Z',
        #   name: 'secret-session' }
        #
        # { key: '2293-session',
        #   value: 'true',
        #   domain: 'localhost',
        #   path: '/',
        #   hostOnly: true,
        #   creation: '2016-09-05T03:03:20.780Z',
        #   lastAccessed: '2016-09-05T03:03:20.780Z',
        #   name: '2293-session' }

        switch
          when cookie.maxAge?
            ## when we have maxAge
            ## prefer that
            ## unix returns us time in seconds
            ## from the epoc + we add that
            ## to maxAge since thats relative seconds
            ## from now
            cookie.expiry = moment().unix() + cookie.maxAge
          when ex = cookie.expires
            ## tough cookie provides javascript date
            ## formatted expires
            cookie.expiry = moment(ex).unix()

        automationFn("set:cookie", cookie)
        .then ->
          ## the automation may return us null in
          ## the case an expired cookie is removed
          Cookies.normalizeCookieProps(cookie)

      Promise.try ->
        store = jar.toJSON()

        debug("setting request jar cookies %o", store.cookies)

        ## this likely needs
        ## to be an 'each' not a map
        ## since we need to set cookies
        ## in sequence and not all at once
        ## because cookies could have colliding
        ## values which need to be set in order
        Promise.each(store.cookies, setCookie)

    sendStream: (headers, automationFn, options = {}) ->
      _.defaults options, {
        headers: {}
        jar: true
      }

      if not caseInsensitiveGet(options.headers, "user-agent") and (ua = headers["user-agent"])
        options.headers["user-agent"] = ua

      ## create a new jar instance
      ## unless its falsy or already set
      if options.jar is true
        options.jar = newCookieJar()

      _.extend options, {
        strictSSL: false
      }

      self = @

      if jar = options.jar
        followRedirect = options.followRedirect

        options.followRedirect = (incomingRes) ->
          ## if we have a cookie jar
          req = @

          newUrl = url.resolve(options.url, incomingRes.headers.location)

          ## and when we know we should follow the redirect
          ## we need to override the init method and
          ## first set the existing jar cookies on the browser
          ## and then grab the cookies for the new url
          req.init = _.wrap req.init, (orig, opts) =>
            self.setJarCookies(jar, automationFn)
            .then ->
              automationFn("get:cookies", {url: newUrl, includeHostOnly: true})
            .then(convertToJarCookie)
            .then (cookies) ->
              setCookies(cookies, jar, null, newUrl)
            .then ->
              orig.call(req, opts)

          followRedirect.call(req, incomingRes)

      send = =>
        debug("sending request as stream %o", _.omit(options, "jar"))

        str = @create(options)
        str.getJar = -> options.jar
        str

      automationFn("get:cookies", {url: options.url, includeHostOnly: true})
      .then(convertToJarCookie)
      .then (cookies) ->
        setCookies(cookies, options.jar, options.headers, options.url)
      .then(send)

    sendPromise: (headers, automationFn, options = {}) ->
      _.defaults options, {
        headers: {}
        gzip: true
        jar: true
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

      ## create a new jar instance
      ## unless its falsy or already set
      if options.jar is true
        options.jar = newCookieJar()

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

      send = =>
        ms = Date.now()

        self             = @
        redirects        = []
        requestResponses = []

        push = (response) ->
          requestResponses.push(pick(response))

        if options.followRedirect
          options.followRedirect = (incomingRes) ->
            newUrl = url.resolve(options.url, incomingRes.headers.location)

            ## normalize the url
            redirects.push([incomingRes.statusCode, newUrl].join(": "))

            push(incomingRes)

            ## if we have a cookie jar
            if jar = options.jar
              req = @

              ## and when we know we should follow the redirect
              ## we need to override the init method and
              ## first set the existing jar cookies on the browser
              ## and then grab the cookies for the new url
              req.init = _.wrap req.init, (orig, opts) =>
                self.setJarCookies(options.jar, automationFn)
                .then ->
                  automationFn("get:cookies", {url: newUrl, includeHostOnly: true})
                .then(convertToJarCookie)
                .then (cookies) ->
                  setCookies(cookies, jar, null, newUrl)
                .then ->
                  orig.call(req, opts)

            ## cause the redirect to happen
            ## but swallow up the incomingRes
            ## so we can build an array of responses
            return true

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

          if options.jar
            @setJarCookies(options.jar, automationFn)
            .return(resp)
          else
            resp

      if c = options.cookies
        ## if we have a cookie object then just
        ## send the request up!
        if _.isObject(c)
          setCookies(c, null, options.headers)
          send()
        else
          ## else go get the cookies first
          ## then make the request

          ## TODO: we can simply use the 'url' property on the cookies API
          ## which automatically pulls all of the cookies that would be
          ## set for that url!
          automationFn("get:cookies", {url: options.url, includeHostOnly: true})
          .then(convertToJarCookie)
          .then (cookies) ->
            setCookies(cookies, options.jar, options.headers, options.url)
          .then(send)
      else
        send()

  }
