_ = require("lodash")
minimatch = require("minimatch")

$utils = require("./utils")
$errUtils = require("./error_utils")
$XHR = require("./xml_http_request")

regularResourcesRe       = /\.(jsx?|coffee|html|less|s?css|svg)(\?.*)?$/
needsDashRe              = /([a-z][A-Z])/g
props                    = "onreadystatechange onload onerror".split(" ")

restoreFn = null

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

responseTypeIsTextOrEmptyString = (responseType) ->
  responseType is "" or responseType is "text"

## when the browser naturally cancels/aborts
## an XHR because the window is unloading
## on chrome < 71
isAbortedThroughUnload = (xhr) ->
  xhr.canceled isnt true and
    xhr.readyState is 4 and
      xhr.status is 0 and
        ## responseText may be undefined on some responseTypes
        ## https://github.com/cypress-io/cypress/issues/3008
        ## TODO: How do we want to handle other responseTypes?
        (responseTypeIsTextOrEmptyString(xhr.responseType)) and
          xhr.responseText is ""

warnOnStubDeprecation = (obj, type) ->
  if _.has(obj, "stub")
    $errUtils.warnByPath("server.stub_deprecated", { args: { type }})

warnOnForce404Default = (obj) ->
  if obj.force404 is false
    $errUtils.warnByPath("server.force404_deprecated")

whitelist = (xhr) ->
  ## whitelist if we're GET + looks like we're fetching regular resources
  xhr.method is "GET" and regularResourcesRe.test(xhr.url)

serverDefaults = {
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
  onOpen: ->
  onSend: ->
  onXhrAbort: ->
  onXhrCancel: ->
  onError: ->
  onLoad: ->
  onFixtureError: ->
  onNetworkError: ->
}

restore = ->
  if restoreFn
    restoreFn()

    restoreFn = null

getStack = ->
  err = new Error
  err.stack.split("\n").slice(3).join("\n")

get404Route = ->
  {
    status: 404
    response: ""
    delay: 0
    headers: null
    is404: true
  }

transformHeaders = (headers) ->
  ## normalize camel-cased headers key
  headers = _.reduce headers, (memo, value, key) ->
    memo[normalize(key)] = value
    memo
  , {}

  JSON.stringify(headers)

normalizeStubUrl = (xhrUrl, url) ->
  if not xhrUrl
    $errUtils.warnByPath("server.xhrurl_not_set")

  ## always ensure this is an absolute-relative url
  ## and remove any double slashes
  xhrUrl = _.compact(xhrUrl.split("/")).join("/")
  url    = _.trimStart(url, "/")
  ["/" + xhrUrl, url].join("/")

getFullyQualifiedUrl = (contentWindow, url) ->
  ## the href getter will always resolve a full path
  a = contentWindow.document.createElement("a")
  a.href = url
  a.href

## override the defaults for all
## servers
defaults = (obj = {}) ->
  ## merge obj into defaults
  _.extend(serverDefaults, obj)

create = (options = {}) ->
  options = _.defaults(options, serverDefaults)

  xhrs    = {}
  proxies = {}
  routes  = []

  ## always start disabled
  ## so we dont handle stubs
  hasEnabledStubs = false

  enableStubs = (bool = true) ->
    hasEnabledStubs = bool

  return server = {
    options

    restore

    getStack

    get404Route

    transformHeaders

    normalizeStubUrl

    getFullyQualifiedUrl

    getOptions: ->
      ## clone the options to prevent
      ## accidental mutations
      _.clone(options)

    getRoutes: ->
      routes

    isWhitelisted: (xhr) ->
      options.whitelist(xhr)

    shouldApplyStub: (route) ->
      hasEnabledStubs and route and route.response?

    applyStubProperties: (xhr, route) ->
      responser = if _.isObject(route.response) then JSON.stringify else null

      ## add header properties for the xhr's id
      ## and the testId
      setHeader(xhr, "id", xhr.id)
      # setHeader(xhr, "testId", options.testId)

      setHeader(xhr, "status",   route.status)
      setHeader(xhr, "response", route.response, responser)
      setHeader(xhr, "matched",  route.url + "")
      setHeader(xhr, "delay",    route.delay)
      setHeader(xhr, "headers",  route.headers, transformHeaders)

    route: (attrs = {}) ->
      warnOnStubDeprecation(attrs, "route")

      ## merge attrs with the server's defaults
      ## so we preserve the state of the attrs
      ## at the time they're created since we
      ## can create another server later

      ## dont mutate the original attrs
      route = _.defaults(
        {},
        attrs,
        _.pick(options, "delay", "method", "status", "autoRespond", "waitOnResponses", "onRequest", "onResponse")
      )

      routes.push(route)

      return route

    getRouteForXhr: (xhr) ->
      ## return the 404 stub if we dont have any stubs
      ## but we are stubbed - meaning we havent added any routes
      ## but have started the server
      ## and this request shouldnt be whitelisted
      if not routes.length and
        hasEnabledStubs and
          options.force404 isnt false and
            not server.isWhitelisted(xhr)
              return get404Route()

      ## bail if we've attached no stubs
      return nope() if not routes.length

      ## bail if this xhr matches our whitelist
      return nope() if server.isWhitelisted(xhr)

      ## loop in reverse to get
      ## the first matching stub
      ## thats been most recently added
      for route in routes by -1
        if server.xhrMatchesRoute(xhr, route)
          return route

      ## else if no stub matched
      ## send 404 if we're allowed to
      if options.force404
        get404Route()
      else
        ## else return null
        return nope()

    methodsMatch: (routeMethod, xhrMethod) ->
      ## normalize both methods by uppercasing them
      routeMethod.toUpperCase() is xhrMethod.toUpperCase()

    urlsMatch: (routePattern, fullyQualifiedUrl) ->
      match = (str, pattern) =>
        ## be nice to our users and prepend
        ## pattern with "/" if it doesnt have one
        ## and str does
        if pattern[0] isnt "/" and str[0] is "/"
          pattern = "/" + pattern

        minimatch(str, pattern, options.urlMatchingOptions)

      testRe = (url1, url2) ->
        routePattern.test(url1) or routePattern.test(url2)

      testStr = (url1, url2) ->
        (routePattern is url1) or
          (routePattern is url2) or
            match(url1, routePattern) or
              match(url2, routePattern)

      if _.isRegExp(routePattern)
        testRe(fullyQualifiedUrl, options.stripOrigin(fullyQualifiedUrl))
      else
        testStr(fullyQualifiedUrl, options.stripOrigin(fullyQualifiedUrl))

    xhrMatchesRoute: (xhr, route) ->
      server.methodsMatch(route.method, xhr.method) and server.urlsMatch(route.url, xhr.url)

    add: (xhr, attrs = {}) ->
      _.extend(xhr, attrs)
      xhr.id = id = _.uniqueId("xhr")
      xhrs[id] = xhr
      proxies[id] = $XHR.create(xhr)

    getProxyFor: (xhr) ->
      proxies[xhr.id]

    abortXhr: (xhr) ->
      proxy = server.getProxyFor(xhr)

      ## if the XHR leaks into the next test
      ## after we've reset our internal server
      ## then this may be undefined
      return if not proxy

      ## return if we're already aborted which
      ## can happen if the browser already canceled
      ## this xhr but we called abort later
      return if xhr.aborted

      xhr.aborted = true

      abortStack = server.getStack()

      proxy.aborted = true

      options.onXhrAbort(proxy, abortStack)

      if _.isFunction(options.onAnyAbort)
        route = server.getRouteForXhr(xhr)

        ## call the onAnyAbort function
        ## after we've called options.onSend
        options.onAnyAbort(route, proxy)

    cancelXhr: (xhr) ->
      proxy = server.getProxyFor(xhr)

      ## if the XHR leaks into the next test
      ## after we've reset our internal server
      ## then this may be undefined
      return if not proxy

      xhr.canceled = true

      proxy.canceled = true

      options.onXhrCancel(proxy)

      return xhr

    cancelPendingXhrs: ->
      ## cancel any outstanding xhr's
      ## which aren't already complete
      ## or already canceled
      return _
      .chain(xhrs)
      .reject({ readyState: 4 })
      .reject({ canceled: true })
      .map(server.cancelXhr)
      .value()

    set: (obj) ->
      warnOnStubDeprecation(obj, "server")
      warnOnForce404Default(obj)

      ## handle enable=true|false
      if obj.enable?
        enableStubs(obj.enable)

      _.extend(options, obj)

    bindTo: (contentWindow) ->
      restore()

      XHR    = contentWindow.XMLHttpRequest
      send   = XHR.prototype.send
      open   = XHR.prototype.open
      abort  = XHR.prototype.abort
      srh    = XHR.prototype.setRequestHeader

      restoreFn = ->
        ## restore the property back on the window
        _.each {send: send, open: open, abort: abort, setRequestHeader: srh}, (value, key) ->
          XHR.prototype[key] = value

      XHR.prototype.setRequestHeader = ->
        ## if the XHR leaks into the next test
        ## after we've reset our internal server
        ## then this may be undefined
        if proxy = server.getProxyFor(@)
          proxy._setRequestHeader.apply(proxy, arguments)

        srh.apply(@, arguments)

      XHR.prototype.abort = ->
        ## if we already have a readyState of 4
        ## then do not get the abort stack or
        ## set the aborted property or call onXhrAbort
        ## to test this just use a regular XHR
        if @readyState isnt 4
          server.abortXhr(@)

        abort.apply(@, arguments)

      XHR.prototype.open = (method, url, async = true, username, password) ->
        ## get the fully qualified url that normally the browser
        ## would be sending this request to

        ## FQDN:               http://www.google.com/responses/users.json
        ## relative:           partials/phones-list.html
        ## absolute-relative:  /app/partials/phones-list.html
        fullyQualifiedUrl = getFullyQualifiedUrl(contentWindow, url)

        ## decode the entire url.display to make
        ## it easier to do assertions
        proxy = server.add(@, {
          method: method
          url: decodeURIComponent(fullyQualifiedUrl)
        })

        ## if this XHR matches a stubbed route then shift
        ## its url to the stubbed url and set the request
        ## headers for the response
        route = server.getRouteForXhr(@)

        if server.shouldApplyStub(route)
          url = server.normalizeStubUrl(options.xhrUrl, fullyQualifiedUrl)

        timeStart = new Date

        xhr = @
        fns = {}
        overrides = {}

        bailIfRecursive = (fn) ->
          isCalled = false

          return () ->
            return if isCalled
            isCalled = true
            try
              return fn.apply(window, arguments)
            finally
              isCalled = false

        onLoadFn = ->
          proxy._setDuration(timeStart)
          proxy._setStatus()
          proxy._setResponseHeaders()
          proxy._setResponseBody()

          if err = proxy._getFixtureError()
            return options.onFixtureError(proxy, err)

          ## catch synchronous errors caused
          ## by the onload function
          try
            if _.isFunction(ol = fns.onload)
              ol.apply(xhr, arguments)
            options.onLoad(proxy, route)
          catch err
            options.onError(proxy, err)

          if _.isFunction(options.onAnyResponse)
            options.onAnyResponse(route, proxy)

        onErrorFn = ->
          ## its possible our real onerror handler
          ## throws so we need to catch those errors too
          try
            if _.isFunction(oe = fns.onerror)
              oe.apply(xhr, arguments)
            options.onNetworkError(proxy)
          catch err
            options.onError(proxy, err)

        onReadyStateFn = ->
          ## catch synchronous errors caused
          ## by the onreadystatechange function
          try
            if isAbortedThroughUnload(xhr)
              server.abortXhr(xhr)

            if _.isFunction(orst = fns.onreadystatechange)
              orst.apply(xhr, arguments)
          catch err
            ## its failed stop sending the callack
            xhr.onreadystatechange = null
            options.onError(proxy, err)

        ## bail if eventhandlers have already been called to prevent
        ## infinite recursion
        overrides.onload             = bailIfRecursive(onLoadFn)
        overrides.onerror            = bailIfRecursive(onErrorFn)
        overrides.onreadystatechange = bailIfRecursive(onReadyStateFn)

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
                -> bak.apply(xhr, arguments)
              else
                overrides[prop]
            set: (fn) ->
              fns[prop] = fn
            configurable: true
          })

        options.onOpen(method, url, async, username, password)

        ## change absolute url's to relative ones
        ## if they match our baseUrl / visited URL
        open.call(@, method, url, async, username, password)

      XHR.prototype.send = (requestBody) ->
        ## if there is an existing route for this
        ## XHR then add those properties into it
        ## only if route isnt explicitly false
        ## and the server is enabled
        route = server.getRouteForXhr(@)
        if server.shouldApplyStub(route)
          server.applyStubProperties(@, route)

        ## capture where this xhr came from
        sendStack = server.getStack()

        ## get the proxy xhr
        proxy = server.getProxyFor(@)

        proxy._setRequestBody(requestBody)

        ## log this out now since it's being sent officially
        ## unless its been whitelisted
        if not server.isWhitelisted(@)
          options.onSend(proxy, sendStack, route)

        if _.isFunction(options.onAnyRequest)
          ## call the onAnyRequest function
          ## after we've called options.onSend
          options.onAnyRequest(route, proxy)

        return send.apply(@, arguments)
  }

module.exports = {
  defaults

  create
}
