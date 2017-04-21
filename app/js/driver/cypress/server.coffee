_ = require("lodash")
minimatch = require("minimatch")

$Utils = require("./utils")

regularResourcesRe       = /\.(jsx?|coffee|html|less|s?css|svg)(\?.*)?$/
isCypressHeaderRe        = /^X-Cypress-/i
needsDashRe              = /([a-z][A-Z])/g
props                    = "onreadystatechange onload onerror".split(" ")

setHeader = (xhr, key, val, transformer) ->
  if val?
    if transformer
      val = transformer(val)

    key = "X-Cypress-" + _.capitalize(key)
    xhr.setRequestHeader(key, encodeURI(val))

normalize = (val) ->
  val = val.replace needsDashRe, (match) ->
    match[0] + "-" + match[1]

  val.toLowerCase()

nope = -> return null

parseJSON = (text) ->
  try
    JSON.parse(text)
  catch
    text

warnOnStubDeprecation = (obj, type) ->
  if _.has(obj, "stub")
    $Utils.warning("""
      Passing cy.#{type}({stub: false}) is now deprecated. You can safely remove: {stub: false}.\n
      https://on.cypress.io/deprecated-stub-false-on-#{type}
    """)

warnOnForce404Default = (obj) ->
  if obj.force404 is false
    $Utils.warning("Passing cy.server({force404: false}) is now the default behavior of cy.server(). You can safely remove this option.")

whitelist = (xhr) ->
  ## whitelist if we're GET + looks like we're fetching regular resources
  xhr.method is "GET" and regularResourcesRe.test(xhr.url)

defaults = {
  testId: ""
  xhrUrl: ""
  method: "GET"
  delay: 0
  status: 200
  headers: null
  response: null
  enable: true
  autoRespond: true
  waitOnResponses: Infinity
  force404: false ## to force 404's for non-stubbed routes
  onAnyAbort: undefined
  onAnyRequest: undefined
  onAnyResponse: undefined
  urlMatchingOptions: { matchBase: true }
  stripOrigin: _.identity
  getUrlOptions: _.identity
  whitelist: whitelist ## function whether to allow a request to go out (css/js/html/templates) etc
  onSend: ->
  onXhrAbort: ->
  onError: ->
  onLoad: ->
  onFixtureError: ->
  onNetworkError: ->
}

## maybe rename this to XMLHttpRequest ?
## so it shows up correctly as an instance in the console
class XMLHttpRequest
  constructor: (@xhr) ->
    @id            = @xhr.id
    @url           = @xhr.url
    @method        = @xhr.method
    @status        = null
    @statusMessage = null
    @request       = {}
    @response      = null

  _getXhr: ->
    @xhr ? $Utils.throwErrByPath("xhr.missing")

  _setDuration: (timeStart) ->
    @duration = (new Date) - timeStart

  _setStatus: ->
    @status = @xhr.status
    @statusMessage = "#{@xhr.status} (#{@xhr.statusText})"

  _setRequestBody: (requestBody = null) ->
    @request.body = parseJSON(requestBody)

  _setResponseBody: ->
    @response ?= {}

    ## if we are a responseType of arraybuffer
    ## then touching responseText will throw and
    ## our ArrayBuffer should just be on the response
    ## object
    @response.body =
      try
        parseJSON(@xhr.responseText)
      catch e
        @xhr.response

  _setResponseHeaders: ->
    ## parse response header string into object
    ## https://gist.github.com/monsur/706839
    headerStr = @xhr.getAllResponseHeaders()

    set = (resp) =>
      @response ?= {}
      @response.headers = resp

    headers = {}
    if not headerStr
      return set(headers)

    headerPairs = headerStr.split('\u000d\u000a')
    for headerPair in headerPairs
      # Can't use split() here because it does the wrong thing
      # if the header value has the string ": " in it.
      index = headerPair.indexOf('\u003a\u0020')
      if index > 0
        key = headerPair.substring(0, index)
        val = headerPair.substring(index + 2)
        headers[key] = val

    set(headers)

  _getFixtureError: ->
    body = @response and @response.body

    if body and err = body.__error
      return err

  _setRequestHeader: (key, val) ->
    return if isCypressHeaderRe.test(key)

    @request.headers ?= {}

    current = @request.headers[key]

    ## if we already have a request header
    ## then prepend val with ', '
    if current
      val = current + ", " + val

    @request.headers[key] = val

  setRequestHeader: ->
    @xhr.setRequestHeader.apply(@xhr, arguments)

  getResponseHeader: ->
    @xhr.getResponseHeader.apply(@xhr, arguments)

  getAllResponseHeaders: ->
    @xhr.getAllResponseHeaders.apply(@xhr, arguments)

  @add = (xhr) ->
    new XMLHttpRequest(xhr)

Object.defineProperties XMLHttpRequest.prototype,
  requestHeaders: {
    get: ->
      @request?.headers
  }

  requestBody: {
    get: ->
      @request?.body
  }

  responseHeaders: {
    get: ->
      @response?.headers
  }

  responseBody: {
    get: ->
      @response?.body
  }

  requestJSON: {
    get: ->
      $Utils.warning("requestJSON is now deprecated and will be removed in the next version. Update this to 'requestBody' or 'request.body'.")
      @requestBody
  }

  responseJSON: {
    get: ->
      $Utils.warning("responseJSON is now deprecated and will be removed in the next version. Update this to 'responseBody' or 'response.body'.")
      @responseBody
  }

class $Server
  constructor: (@options = {}) ->
    _.defaults @options, defaults

    ## what about holding a reference to the test id?
    ## to prevent cross pollution of requests?

    ## what about restoring the server?
    @xhrs     = {}
    @proxies  = {}
    @routes   = []

    ## always start disabled
    ## so we dont handle stubs
    @enableStubs(false)

  getOptions: -> _.clone(@options)

  isWhitelisted: (xhr) ->
    @options.whitelist.call(@, xhr)

  getFullyQualifiedUrl: (contentWindow, url) ->
    ## the href getter will always resolve a full path
    a = contentWindow.document.createElement("a")
    a.href = url
    a.href

  getStack: ->
    err = new Error
    err.stack.split("\n").slice(3).join("\n")

  shouldApplyStub: (route) ->
    ## make sure the route or the server is enabled
    ## and make sure our response isnt null or undefined
    @isEnabled and route and route.response?

  transformHeaders: (headers) ->
    ## normalize camel-cased headers key
    headers = _.reduce headers, (memo, value, key) ->
      memo[normalize(key)] = value
      memo
    , {}

    JSON.stringify(headers)

  applyStubProperties: (xhr, route) ->
    responser = if _.isObject(route.response) then JSON.stringify else null

    ## add header properties for the xhr's id
    ## and the testId
    setHeader(xhr, "id", xhr.id)
    # setHeader(xhr, "testId", getServer().options.testId)

    setHeader(xhr, "status",   route.status)
    setHeader(xhr, "response", route.response, responser)
    setHeader(xhr, "matched",  route.url + "")
    setHeader(xhr, "delay",    route.delay)
    setHeader(xhr, "headers",  route.headers, @transformHeaders)

  normalizeStubUrl: (xhrUrl, url) ->
    if not xhrUrl
      $Utils.warning("'Server.options.xhrUrl' has not been set")

    ## always ensure this is an absolute-relative url
    ## and remove any double slashes
    xhrUrl = _.compact(xhrUrl.split("/")).join("/")
    url    = _.trimStart(url, "/")
    ["/" + xhrUrl, url].join("/")

  route: (attrs = {}) ->
    warnOnStubDeprecation(attrs, "route")

    ## merge attrs with the server's defaults
    ## so we preserve the state of the attrs
    ## at the time they're created since we
    ## can create another server later

    ## dont mutate the original attrs
    route = _.defaults {}, attrs, _.pick(@options, "delay", "method", "status", "autoRespond", "waitOnResponses", "onRequest", "onResponse")
    @routes.push(route)

    return route

  getRouteForXhr: (xhr) ->
    ## return the 404 stub if we dont have any stubs
    ## but we are stubbed - meaning we havent added any routes
    ## but have started the server
    ## and this request shouldnt be whitelisted
    if not @routes.length and
      @isEnabled and
        @options.force404 isnt false and
          not @isWhitelisted(xhr)
            return @get404Route()

    ## bail if we've attached no stubs
    return nope() if not @routes.length

    ## bail if this xhr matches our whitelist
    return nope() if @isWhitelisted(xhr)

    ## loop in reverse to get
    ## the first matching stub
    ## thats been most recently added
    for route in @routes by -1
      if @xhrMatchesRoute(xhr, route)
        return route

    ## else if no stub matched
    ## send 404 if we're allowed to
    if @options.force404
      @get404Route()
    else
      ## else return null
      return nope()

  get404Route: ->
    {
      status: 404
      response: ""
      delay: 0
      headers: null
      is404: true
    }

  urlsMatch: (routePattern, fullyQualifiedUrl) ->
    match = (str, pattern) =>
      ## be nice to our users and prepend
      ## pattern with "/" if it doesnt have one
      ## and str does
      if pattern[0] isnt "/" and str[0] is "/"
        pattern = "/" + pattern

      minimatch(str, pattern, @options.urlMatchingOptions)

    testRe = (url1, url2) ->
      routePattern.test(url1) or routePattern.test(url2)

    testStr = (url1, url2) ->
      (routePattern is url1) or
        (routePattern is url2) or
          match(url1, routePattern) or
            match(url2, routePattern)

    if _.isRegExp(routePattern)
      testRe(fullyQualifiedUrl, @options.stripOrigin(fullyQualifiedUrl))
    else
      testStr(fullyQualifiedUrl, @options.stripOrigin(fullyQualifiedUrl))

  xhrMatchesRoute: (xhr, route) ->
    xhr.method is route.method and @urlsMatch(route.url, xhr.url)

  add: (xhr, attrs = {}) ->
    _.extend(xhr, attrs)
    xhr.id = id = _.uniqueId("xhr")
    @xhrs[id] = xhr
    @proxies[id] = XMLHttpRequest.add(xhr)

  getProxyFor: (xhr) ->
    @proxies[xhr.id]

  abort: ->
    ## abort any outstanding xhr's
    ## which aren't already aborted
    xhrs = _.filter @xhrs, (xhr) ->
      xhr.aborted isnt true and xhr.readyState isnt 4

    _.invokeMap(xhrs, "abort")

    return @

  enableStubs: (bool = true) ->
    @isEnabled = bool

  set: (obj) ->
    warnOnStubDeprecation(obj, "server")
    warnOnForce404Default(obj)

    ## handle enable=true|false
    if obj.enable?
      @enableStubs(obj.enable)

    _.extend(@options, obj)

  ## noop by default to keep
  ## standard interface
  restore: ->

  bindTo: (contentWindow) ->
    $Server.bindTo(contentWindow, => @)

  @bindTo = (contentWindow, getServer) ->
    XHR    = contentWindow.XMLHttpRequest
    send   = XHR.prototype.send
    open   = XHR.prototype.open
    abort  = XHR.prototype.abort
    srh    = XHR.prototype.setRequestHeader

    getServer().restore = ->
      ## restore the property back on the window
      contentWindow.XMLHttpRequest = XHR

      _.each {send: send, open: open, abort: abort, setRequestHeader: srh}, (value, key) ->
        XHR.prototype[key] = value

      return {contentWindow: contentWindow, XMLHttpRequest: XHR}

    XHR.prototype.setRequestHeader = ->
      proxy = getServer().getProxyFor(@)

      proxy._setRequestHeader.apply(proxy, arguments)

      srh.apply(@, arguments)

    XHR.prototype.abort = ->
      ## if we already have a readyState of 4
      ## then do not get the abort stack or
      ## set the aborted property or call onXhrAbort
      ## to test this just use a regular XHR
      @aborted = true

      abortStack = getServer().getStack()

      proxy = getServer().getProxyFor(@)
      proxy.aborted = true

      getServer().options.onXhrAbort(proxy, abortStack)

      if _.isFunction(getServer().options.onAnyAbort)
        route = getServer().getRouteForXhr(@)

        ## call the onAnyAbort function
        ## after we've called getServer().options.onSend
        getServer().options.onAnyAbort(route, proxy)

      abort.apply(@, arguments)

    XHR.prototype.open = (method, url, async = true, username, password) ->
      ## get the fully qualified url that normally the browser
      ## would be sending this request to

      ## FQDN:               http://www.google.com/responses/users.json
      ## relative:           partials/phones-list.html
      ## absolute-relative:  /app/partials/phones-list.html
      fullyQualifiedUrl = getServer().getFullyQualifiedUrl(contentWindow, url)

      ## decode the entire url.display to make
      ## it easier to do assertions
      proxy = getServer().add(@, {
        method: method
        url: decodeURIComponent(fullyQualifiedUrl)
      })

      ## if this XHR matches a stubbed route then shift
      ## its url to the stubbed url and set the request
      ## headers for the response
      route = getServer().getRouteForXhr(@)
      if getServer().shouldApplyStub(route)
        url = getServer().normalizeStubUrl(getServer().options.xhrUrl, fullyQualifiedUrl)

      timeStart = new Date

      xhr = @
      fns = {}
      called = {}
      overrides = {}
      readyStates = {}

      onLoadFn = ->
        ## bail if we've already been called to prevent
        ## infinite recursion
        return if called.onload

        called.onload = true

        proxy._setDuration(timeStart)
        proxy._setStatus()
        proxy._setResponseHeaders()
        proxy._setResponseBody()

        if err = proxy._getFixtureError()
          return getServer().options.onFixtureError(proxy, err)

        ## catch synchronous errors caused
        ## by the onload function
        try
          if _.isFunction(ol = fns.onload)
            ol.apply(xhr, arguments)
          getServer().options.onLoad(proxy, route)
        catch err
          getServer().options.onError(proxy, err)

        if _.isFunction(getServer().options.onAnyResponse)
          getServer().options.onAnyResponse(route, proxy)

      onErrorFn = ->
        ## bail if we've already been called to prevent
        ## infinite recursion
        return if called.onerror

        called.onerror = true

        ## its possible our real onerror handler
        ## throws so we need to catch those errors too
        try
          if _.isFunction(oe = fns.onerror)
            oe.apply(xhr, arguments)
          getServer().options.onNetworkError(proxy)
        catch err
          getServer().options.onError(proxy, err)

      onReadyStateFn = ->
        ## bail if we've already been called with this
        ## readyState to prevent infinite recursions
        return if readyStates[@readyState]

        readyStates[@readyState] = true

        ## catch synchronous errors caused
        ## by the onreadystatechange function
        try
          if _.isFunction(orst = fns.onreadystatechange)
            orst.apply(xhr, arguments)
        catch err
          ## its failed stop sending the callack
          xhr.onreadystatechange = null
          getServer().options.onError(proxy, err)

      overrides.onload             = onLoadFn
      overrides.onerror            = onErrorFn
      overrides.onreadystatechange = onReadyStateFn

      props.forEach (prop) ->
        ## if we currently have one of these properties then
        ## back them up!
        if fn = xhr[prop]
          fns[prop] = fn

        ## set the override now
        xhr[prop] = overrides[prop]

        ## and in the future if this is redefined
        ## then just back it up
        Object.defineProperty(xhr, prop, {
          get: ->
            bak = fns[prop]

            if _.isFunction(bak)
              fns[prop] = ->
                bak.apply(xhr, arguments)
            else
              overrides[prop]
          set: (fn) ->
            fns[prop] = fn
        })

      ## change absolute url's to relative ones
      ## if they match our baseUrl / visited URL
      open.call(@, method, url, async, username, password)

    XHR.prototype.send = (requestBody) ->
      ## if there is an existing route for this
      ## XHR then add those properties into it
      ## only if route isnt explicitly false
      ## and the server is enabled
      route = getServer().getRouteForXhr(@)
      if getServer().shouldApplyStub(route)
        getServer().applyStubProperties(@, route)

      ## capture where this xhr came from
      sendStack = getServer().getStack()

      ## get the proxy xhr
      proxy = getServer().getProxyFor(@)

      proxy._setRequestBody(requestBody)

      ## log this out now since it's being sent officially
      ## unless its been whitelisted
      if not getServer().isWhitelisted(@)
        getServer().options.onSend(proxy, sendStack, route)

      if _.isFunction(getServer().options.onAnyRequest)
        ## call the onAnyRequest function
        ## after we've called getServer().options.onSend
        getServer().options.onAnyRequest(route, proxy)

      return send.apply(@, arguments)

  ## override the defaults for all
  ## servers
  @defaults = (obj = {}) ->
    ## merge obj into defaults
    _.extend defaults, obj

  @XMLHttpRequest = XMLHttpRequest

  @create = (options) ->
    new $Server(options)

module.exports = $Server
