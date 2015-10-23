$Cypress.Server2 = do ($Cypress, _) ->

  twoOrMoreDoubleSlashesRe = /\/{2,}/g
  regularResourcesRe       = /\.(jsx?|html|css)$/
  isCypressHeaderRe        = /^X-Cypress-/i

  setHeader = (xhr, key, val, transformer) ->
    if val?
      if transformer
        val = transformer(val)

      key = "X-Cypress-" + _.capitalize(key)
      xhr.setRequestHeader(key, val)

  nope = -> return null

  parseJSON = (text) ->
    try
      JSON.parse(text)
    catch
      text

  whitelist = (xhr) ->
    ## whitelist if we're GET + looks like we're fetching regular resources
    xhr.method is "GET" and regularResourcesRe.test(xhr.url)

  defaults = {
    testId: ""
    xhrUrl: ""
    delay: 0
    status: 200
    stub: true
    enable: true
    autoRespond: true
    waitOnResponse: Infinity
    force404: true ## or allow 404's
    onRequest: undefined
    onResponse: undefined
    normalizeUrl: _.identity
    whitelist: whitelist ## function whether to allow a request to go out (css/js/html/templates) etc
    onSend: ->
    onAbort: ->
    onError: ->
    onLoad: ->
  }

  ## maybe rename this to XMLHttpRequest ?
  ## so it shows up correctly as an instance in the console
  class XMLHttpRequest
    constructor: (@xhr) ->
      @id            = @xhr.id
      @url           = @xhr.url
      @method        = @xhr.method
      @status        = null
      @response      = null
      @statusMessage = null
      @headers       = {
        request: {}
        response: {}
      }

    getXhr: ->
      @xhr ? throw new Error("XMLHttpRequest#xhr is missing!")

    setDuration: (timeStart) ->
      @duration = (new Date) - timeStart

    setStatus: ->
      @status = @xhr.status
      @statusMessage = "#{@xhr.status} (#{@xhr.statusText})"

    setResponse: ->
      ## if request was for JSON
      ## and this isnt valid JSON then
      ## we should prob throw a very
      ## specific error
      @response = parseJSON(@xhr.responseText)

    setResponseHeaders: ->
      ## parse response header string into object
      ## https://gist.github.com/monsur/706839
      headerStr = @xhr.getAllResponseHeaders()

      set = (resp) =>
        @headers.response = resp

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

      current = @headers.request[key]

      ## if we already have a request header
      ## then prepend val with ', '
      if current
        val = ", " + val

      @headers.request[key] = val

    @add = (xhr) ->
      new XMLHttpRequest(xhr)

  class $Server
    constructor: (@options = {}) ->
      _.defaults @options, defaults

      ## what about holding a reference to the test id?
      ## to prevent cross pollution of requests?

      ## what about restoring the server?
      @xhrs     = {}
      @proxies  = {}
      @stubs    = []
      @isActive = true

      ## always start disabled
      ## so we dont handle stubs
      @enableStubs(false)

    bindTo: (contentWindow) ->
      server = @

      XHR    = contentWindow.XMLHttpRequest
      send   = XHR.prototype.send
      open   = XHR.prototype.open
      abort  = XHR.prototype.abort
      srh    = XHR.prototype.setRequestHeader

      server.restore = ->
        _.each {send: send, open: open, abort: abort, setRequestHeader: srh}, (value, key) ->
          XHR.prototype[key] = value

      XHR.prototype.setRequestHeader = ->
        proxy = server.getProxyFor(@)

        proxy.setRequestHeader.apply(proxy, arguments)

        srh.apply(@, arguments)

      XHR.prototype.abort = ->
        ## if we already have a readyState of 4
        ## then do not get the abort stack or
        ## set the aborted property or call onAbort
        ## to test this just use a regular XHR
        @aborted = true

        abortStack = server.getStack()

        proxy = server.getProxyFor(@)
        proxy.aborted = true

        server.options.onAbort(proxy, abortStack)

        abort.apply(@, arguments)

      XHR.prototype.open = (method, url, async = true, username, password) ->
        server.add(@, {
          method: method
          url: url
        })

        ## always normalize the url
        url = server.options.normalizeUrl(url)

        ## if this XHR matches a mocked route then shift
        ## its url to the mocked url and set the request
        ## headers for the response
        stub = server.getStubForXhr(@)
        if server.shouldApplyStub(stub)
          url = server.normalizeStubUrl(server.options.xhrUrl, url)

        ## change absolute url's to relative ones
        ## if they match our baseUrl / visited URL
        open.call(@, method, url, async, username, password)

      XHR.prototype.send = (@requestBody = null) ->
        ## dont send anything if our server isnt active
        ## anymore
        return if not server.isActive

        if _.isString(@requestBody)
          try
            ## attempt setting request json
            ## if requestBody is a string
            @requestJSON = JSON.parse(@requestBody)

        ## add header properties for the xhr's id
        ## and the testId
        setHeader(@, "id", @id)
        setHeader(@, "testId", server.options.testId)

        ## if there is an existing stub for this
        ## XHR then add those properties into it
        ## only if stub isnt explicitly false
        ## and the server is enabled
        stub = server.getStubForXhr(@)
        if server.shouldApplyStub(stub)
          server.applyStubProperties(@, stub)

        ## capture where this xhr came from
        sendStack = server.getStack()

        ## get the proxy xhr
        proxy = server.getProxyFor(@)

        ## log this out now since it's being sent officially
        ## unless its been whitelisted
        if not server.options.whitelist.call(server, @)
          server.options.onSend(proxy, sendStack, stub)

        if stub and _.isFunction(stub.onRequest)
          ## call the onRequest function
          ## after we've called server.options.onSend
          stub.onRequest(@)

        timeStart = new Date

        ## if our server is in specific mode for
        ## not waiting or auto responding or delay
        ## or not logging or auto responding with 404
        ## do that here.
        onload = @onload
        @onload = ->
          proxy.setDuration(timeStart)
          proxy.setStatus()
          proxy.setResponse()
          proxy.setResponseHeaders()

          ## catch synchronous errors caused
          ## by the onload function
          try
            if _.isFunction(onload)
              onload.apply(@, arguments)
            server.options.onLoad(proxy, stub)
          catch err
            server.options.onError(proxy, err)

        onerror = @onerror
        @onerror = ->
          console.log "onerror"
          debugger

        send.apply(@, arguments)

    getStack: ->
      err = new Error
      err.stack.split("\n").slice(3).join("\n")

    shouldApplyStub: (stub) ->
      ## make sure the stub or the server isnt 'unstubbed'
      stub and stub.stub isnt false and @isStubbed()

    applyStubProperties: (xhr, stub) ->
      responser = if _.isObject(stub.response) then JSON.stringify else null

      setHeader(xhr, "status",   stub.status)
      setHeader(xhr, "response", stub.response, responser)
      setHeader(xhr, "matched",  stub.url + "")
      setHeader(xhr, "delay",    stub.delay)
      setHeader(xhr, "headers",  stub.headers, JSON.stringify)

    normalizeStubUrl: (xhrUrl, url) ->
      ## always ensure this is an absolute-relative url
      ## and remove any double slashes
      ["/" + xhrUrl, url].join("/").replace(twoOrMoreDoubleSlashesRe, "/")

    stub: (attrs = {}) ->
      ## merge attrs with the server's defaults
      ## so we preserve the state of the attrs
      ## at the time they're created since we
      ## can create another server later

      ## dont mutate the original attrs
      stub = _.defaults {}, attrs, _(@options).pick("delay", "method", "status", "stub", "autoRespond", "waitOnResponse", "onRequest", "onResponse")
      @stubs.push(stub)

      return stub

    getStubForXhr: (xhr) ->
      ## bail if we've attached no stubs
      return nope() if not @stubs.length

      ## bail if this xhr matches our whitelist
      return nope() if @options.whitelist.call(@, xhr)

      ## loop in reverse to get
      ## the first matching stub
      ## thats been most recently added
      for stub in @stubs by -1
        if @xhrMatchesStub(xhr, stub)
          return stub

      ## else if no stub matched
      ## send 404 if we're allowed to
      if @options.force404
        @get404Stub()
      else
        ## else return null
        return nope()

    get404Stub: ->
      {
        status: 404
        response: ""
        delay: 0
        headers: null
      }

    xhrMatchesStub: (xhr, stub) ->
      xhr.method is stub.method and
        if _.isRegExp(stub.url)
          stub.url.test(xhr.url)
        else
          stub.url is xhr.url

    add: (xhr, attrs = {}) ->
      _.extend(xhr, attrs)
      xhr.id = id = _.uniqueId("xhr")
      @xhrs[id] = xhr
      @proxies[id] = XMLHttpRequest.add(xhr)

    getProxyFor: (xhr) ->
      @proxies[xhr.id]

    deactivate: ->
      @isActive = false

      ## abort any outstanding xhr's
      _(@xhrs).chain().filter((xhr) ->
        xhr.readyState isnt 4
      ).invoke("abort")

      return @

    isStubbed: ->
      !!@isEnabled

    enableStubs: (bool = true) ->
      @isEnabled = bool

    set: (obj) ->
      ## handle enable=true|false
      if obj.enable?
        @enableStubs(obj.enable)

      _.extend(@options, obj)

    ## noop by default to keep
    ## standard interface
    restore: ->

    ## override the defaults for all
    ## servers
    @defaults = (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

    @Proxy = XMLHttpRequest

    @create = (options) ->
      new $Server(options)

  return $Server