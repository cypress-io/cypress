$Cypress.Server2 = do ($Cypress, _) ->

  twoOrMoreDoubleSlashesRe = /\/{2,}/g

  header = (val) ->
    "X-Cypress-" + _.capitalize(val)

  class $Server
    constructor: (contentWindow, options = {}) ->
      _.defaults options,
        xhrUrl: ""
        onSend: ->
        onAbort: ->
        onError: ->
        onLoad: ->

      ## what about holding a reference to the test id?
      ## to prevent cross pollution of requests?

      ## what about restoring the server?
      @xhrs     = {}
      @stubs    = []
      @isActive = true

      server = @

      XHR = contentWindow.XMLHttpRequest
      send = XHR.prototype.send
      open = XHR.prototype.open

      XHR.prototype.open = (method, url, async, username, password) ->
        server.add(@, {
          method: method
          url: url
        })

        ## if this XHR matches a mocked route then shift
        ## its url to the mocked url and set the request
        ## headers for the response
        url = server.normalizeStubUrl(options.xhrUrl, url)

        ## change absolute url's to relative ones
        ## if they match our baseUrl / visited URL
        open.call(@, method, url, async, username, password)

      XHR.prototype.send = ->
        ## dont send anything if our server isnt active
        ## anymore
        return if not server.isActive

        @initiator = server.getInitiatorStack(@)

        if stub = server.getStubForXhr(@)
          server.applyStubProperties(@, stub)

        ## log this out now since it's being sent officially
        options.onSend(@)

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
            options.onError(@, err)

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
            options.onLoad(@)

        send.apply(@, arguments)

    getInitiatorStack: (xhr) ->
      err = new Error
      err.stack.split("\n").slice(3)

    applyStubProperties: (xhr, stub) ->
      xhr.setRequestHeader header("status"),   stub.status
      xhr.setRequestHeader header("response"), JSON.stringify(stub.response)
      xhr.setRequestHeader header("matched"),  stub.url
      xhr.setRequestHeader header("delay"),    stub.delay

      xhr.isStub = true

      ## either look at accepts / content-type
      ## or the response to figure out whether
      ## to set requestJSON

      ## set accepts / content-type headers?

      ## parse the request into requestJSON?

      ## call the onRequest function
      # stub.onRequest(xhr)

    normalizeStubUrl: (xhrUrl, url) ->
      ## always ensure this is an absolute-relative url
      ## and remove any double slashes
      ["/" + xhrUrl, url].join("/").replace(twoOrMoreDoubleSlashesRe, "/")

    stub: (attrs = {}) ->
      @stubs.push(attrs)

    getStubForXhr: (xhr) ->
      ## loop in reverse to get
      ## the first matching stub
      ## thats been most recently added
      for stub in @stubs by -1
        if @xhrMatchesStub(xhr, stub)
          return stub

    xhrMatchesStub: (xhr, stub) ->
      return true

    find: (xhr) ->
      @xhrs[xhr.id]

    add: (xhr, attrs = {}) ->
      _.extend(xhr, attrs)
      xhr.id = id = _.uniqueId("xhr")
      @xhrs[id] = xhr

    restore: ->
      @isActive = false

      ## abort any outstanding xhr's

    @initialize = (contentWindow, options) ->
      new $Server(contentWindow, options)

  return $Server