$Cypress.Server = do ($Cypress, _) ->

  regularResourcesRe       = /\.(jsx?|coffee|html|less|s?css)(\?.*)?$/
  isCypressHeaderRe        = /^X-Cypress-/i
  needsDashRe              = /([a-z][A-Z])/g

  setHeader = (xhr, key, val, transformer) ->
    if val?
      if transformer
        val = transformer(val)

      key = "X-Cypress-" + _.capitalize(key)
      xhr.setRequestHeader(key, val)

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
      console.warn("""
        Passing cy.#{type}({stub: false}) is now deprecated. You can safely remove: {stub: false}.\n
        http://on.cypress.io/deprecated-stub-false-on-#{type}
      """)

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
    force404: true ## or allow 404's
    onAnyRequest: undefined
    onAnyResponse: undefined
    stripOrigin: _.identity
    getUrlOptions: _.identity
    whitelist: whitelist ## function whether to allow a request to go out (css/js/html/templates) etc
    onSend: ->
    onAbort: ->
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

    getXhr: ->
      @xhr ? throw new Error("XMLHttpRequest#xhr is missing!")

    setDuration: (timeStart) ->
      @duration = (new Date) - timeStart

    setStatus: ->
      @status = @xhr.status
      @statusMessage = "#{@xhr.status} (#{@xhr.statusText})"

    setRequestBody: (requestBody = null) ->
      @request.body = parseJSON(requestBody)

    setResponseBody: ->
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

    setResponseHeaders: ->
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

    setRequestHeader: (key, val) ->
      return if isCypressHeaderRe.test(key)

      @request.headers ?= {}

      current = @request.headers[key]

      ## if we already have a request header
      ## then prepend val with ', '
      if current
        val = ", " + val

      @request.headers[key] = val

    getFixtureError: ->
      body = @response and @response.body

      if body and err = body.__error
        return err

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
        console.warn("requestJSON is now deprecated and will be removed in the next version. Update this to 'requestBody' or 'request.body'.")
        @requestBody
    }

    responseJSON: {
      get: ->
        console.warn("responseJSON is now deprecated and will be removed in the next version. Update this to 'responseBody' or 'response.body'.")
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

      setHeader(xhr, "status",   route.status)
      setHeader(xhr, "response", route.response, responser)
      setHeader(xhr, "matched",  route.url + "")
      setHeader(xhr, "delay",    route.delay)
      setHeader(xhr, "headers",  route.headers, @transformHeaders)

    normalizeStubUrl: (xhrUrl, url) ->
      if not xhrUrl
        console.warn("'Server.options.xhrUrl' has not been set")

      ## always ensure this is an absolute-relative url
      ## and remove any double slashes
      xhrUrl = _.compact(xhrUrl.split("/")).join("/")
      url    = _.ltrim(url, "/")
      ["/" + xhrUrl, url].join("/")

    route: (attrs = {}) ->
      warnOnStubDeprecation(attrs, "route")

      ## merge attrs with the server's defaults
      ## so we preserve the state of the attrs
      ## at the time they're created since we
      ## can create another server later

      ## dont mutate the original attrs
      route = _.defaults {}, attrs, _(@options).pick("delay", "method", "status", "autoRespond", "waitOnResponses", "onRequest", "onResponse")
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

    xhrMatchesRoute: (xhr, route) ->
      testRe = (url1, url2) ->
        route.url.test(url1) or route.url.test(url2)

      testStr = (url1, url2) ->
        route.url is url1 or route.url is url2

      xhr.method is route.method and
        if _.isRegExp(route.url)
          testRe(xhr.url, @options.stripOrigin(xhr.url))
        else
          testStr(xhr.url, @options.stripOrigin(xhr.url))

    add: (xhr, attrs = {}) ->
      _.extend(xhr, attrs)
      xhr.id = id = _.uniqueId("xhr")
      @xhrs[id] = xhr
      @proxies[id] = XMLHttpRequest.add(xhr)

    getProxyFor: (xhr) ->
      @proxies[xhr.id]

    abort: ->
      ## abort any outstanding xhr's
      _(@xhrs).chain().filter((xhr) ->
        xhr.readyState isnt 4
      ).invoke("abort")

      return @

    enableStubs: (bool = true) ->
      @isEnabled = bool

    set: (obj) ->
      warnOnStubDeprecation(obj, "server")

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

        proxy.setRequestHeader.apply(proxy, arguments)

        srh.apply(@, arguments)

      XHR.prototype.abort = ->
        ## if we already have a readyState of 4
        ## then do not get the abort stack or
        ## set the aborted property or call onAbort
        ## to test this just use a regular XHR
        @aborted = true

        abortStack = getServer().getStack()

        proxy = getServer().getProxyFor(@)
        proxy.aborted = true

        getServer().options.onAbort(proxy, abortStack)

        abort.apply(@, arguments)

      XHR.prototype.open = (method, url, async = true, username, password) ->
        ## get the fully qualified url that normally the browser
        ## would be sending this request to

        ## FQDN:               http://www.google.com/responses/users.json
        ## relative:           partials/phones-list.html
        ## absolute-relative:  /app/partials/phones-list.html
        originalUrl = getServer().getFullyQualifiedUrl(contentWindow, url)

        ## resolve handling actual + display url's
        url = getServer().options.getUrlOptions(originalUrl)

        ## decode the entire url.display to make
        ## it easier to do assertions
        proxy = getServer().add(@, {
          method: method
          url: decodeURIComponent(url.display)
        })

        ## if this XHR matches a stubbed route then shift
        ## its url to the stubbed url and set the request
        ## headers for the response
        route = getServer().getRouteForXhr(@)
        if getServer().shouldApplyStub(route)
          url.actual = getServer().normalizeStubUrl(getServer().options.xhrUrl, url.actual)

        ## change absolute url's to relative ones
        ## if they match our baseUrl / visited URL
        open.call(@, method, url.actual, async, username, password)

      XHR.prototype.send = (requestBody) ->
        ## add header properties for the xhr's id
        ## and the testId
        setHeader(@, "id", @id)
        setHeader(@, "testId", getServer().options.testId)

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

        proxy.setRequestBody(requestBody)

        ## log this out now since it's being sent officially
        ## unless its been whitelisted
        if not getServer().isWhitelisted(@)
          getServer().options.onSend(proxy, sendStack, route)

        if _.isFunction(getServer().options.onAnyRequest)
          ## call the onAnyRequest function
          ## after we've called getServer().options.onSend
          getServer().options.onAnyRequest(route, proxy)

        timeStart = new Date

        ## if our server is in specific mode for
        ## not waiting or auto responding or delay
        ## or not logging or auto responding with 404
        ## do that here.
        onload = @onload
        @onload = ->
          proxy.setDuration(timeStart)
          proxy.setStatus()
          proxy.setResponseHeaders()
          proxy.setResponseBody()

          if err = proxy.getFixtureError()
            return getServer().options.onFixtureError(proxy, err)

          ## catch synchronous errors caused
          ## by the onload function
          try
            if _.isFunction(onload)
              onload.apply(@, arguments)
            getServer().options.onLoad(proxy, route)
          catch err
            getServer().options.onError(proxy, err)

          if _.isFunction(getServer().options.onAnyResponse)
            getServer().options.onAnyResponse(route, proxy)

        onerror = @onerror
        @onerror = ->
          ## its possible our real onerror handler
          ## throws so we need to catch those errors too
          try
            if _.isFunction(onerror)
              onerror.apply(@, arguments)
            getServer().options.onNetworkError(proxy)
          catch err
            getServer().options.onError(proxy, err)

        send.apply(@, arguments)

    ## override the defaults for all
    ## servers
    @defaults = (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

    @XMLHttpRequest = XMLHttpRequest

    @create = (options) ->
      new $Server(options)

  return $Server