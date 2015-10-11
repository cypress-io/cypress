$Cypress.Server2 = do ($Cypress, _) ->

  twoOrMoreDoubleSlashesRe = /\/{2,}/g
  regularResourcesRe       = /\.(js|html|css)$/

  setHeader = (xhr, key, val, transformer) ->
    if val?
      if transformer
        val = transformer(val)

      key = "X-Cypress-" + _.capitalize(key)
      xhr.setRequestHeader(key, val)

  nope = -> return null

  whitelist = (xhr) ->
    ## whitelist if we're GET + looks like we're fetching regular resources
    xhr.method is "GET" and regularResourcesRe.test(xhr.url)

  defaults = {
    testId: ""
    xhrUrl: ""
    delay: 0
    enable: true
    autoRespond: true
    waitOnResponse: Infinity
    force404: true ## or allow 404's
    normalizeUrl: _.identity
    whitelist: whitelist ## function whether to allow a request to go out (css/js/html/templates) etc
    onSend: ->
    onAbort: ->
    onError: ->
    onLoad: ->
  }

  class $Server
    constructor: (@options = {}) ->
      _.defaults @options, defaults

      ## what about holding a reference to the test id?
      ## to prevent cross pollution of requests?

      ## what about restoring the server?
      @xhrs     = {}
      @stubs    = []
      @isActive = true

      ## always start disabled
      ## so we dont handle stubs
      @enableStubs(false)

    bindTo: (contentWindow) ->
      server = @

      XHR   = contentWindow.XMLHttpRequest
      send  = XHR.prototype.send
      open  = XHR.prototype.open
      abort = XHR.prototype.abort

      XHR.prototype.abort = ->
        @aborted = true

        abortStack = server.getStack()

        server.options.onAbort(@, abortStack)

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
        if server.getStubForXhr(@)
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
        if stub = server.getStubForXhr(@)
          server.applyStubProperties(@, stub)

        ## capture where this xhr came from
        sendStack = server.getStack()

        ## log this out now since it's being sent officially
        server.options.onSend(@, sendStack, stub)

        if stub
          ## call the onRequest function
          ## after we've called server.options.onSend
          stub.onRequest(@)

        ## if our server is in specific mode for
        ## not waiting or auto responding or delay
        ## or not logging or auto responding with 404
        ## do that here.
        onload = @onload
        @onload = ->
          ## catch synchronous errors caused
          ## by the onload function
          try
            onload.apply(@, arguments)
          catch err
            server.options.onError(@, err)

        onerror = @onerror
        @onerror = ->
          console.log "onerror"
          debugger

        ## wait until the last possible moment to attach to onreadystatechange
        orst = @onreadystatechange
        @onreadystatechange = ->
          if _.isFunction(orst)
            orst.apply(@, arguments)

          ## override xhr.onload so we
          ## can catch XHR related errors
          ## that happen on the response?

          ## log stuff here when its done
          if @readyState is 4
            server.options.onLoad(@, stub)

        send.apply(@, arguments)

    getStack: ->
      err = new Error
      err.stack.split("\n").slice(3).join("\n")

    applyStubProperties: (xhr, stub) ->
      setHeader(xhr, "status",   stub.status)
      setHeader(xhr, "response", stub.response, JSON.stringify)
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
      stub = _.defaults {}, attrs, _(@options).pick("delay", "autoRespond", "waitOnResponse")
      @stubs.push(stub)

      return stub

    getStubForXhr: (xhr) ->
      ## bail if we're not currently stubbed
      return nope() if not @isStubbed()

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
      if enable = obj.enable
        @enableStubs(enable)

      _.extend(@options, obj)

    ## override the defaults for all
    ## servers
    @defaults = (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

    @create = (options) ->
      new $Server(options)

  return $Server