## attach to Cypress global

$Cypress.Server = do ($Cypress, _) ->

  class $Server
    constructor: (@fakeServer, options) ->
      ## think about moving these properties to a getter/setter
      ## system which is cleaned up during restore to
      ## remove all references.  check if these are being
      ## GC'd properly

      @queue      = []
      @requests   = []
      @responses  = []
      @onRequests = []

      @beforeRequest = options.beforeRequest
      @afterResponse = options.afterResponse
      @onError       = options.onError
      @_delay        = options.delay
      @_autoRespond  = options.respond

      @ignore(options.ignore)
      @onFilter(options.onFilter)
      @respondImmediately(options.respond)

      _this = @

      ## override the processRequest method
      @fakeServer.processRequest = (xhr) ->
        ## bail if xhr has been aborted
        return if xhr.aborted

        for response in (@responses or []) by -1
          ## response.response holds the function we are
          ## testing against
          return if response.response.call(@, xhr)

        ## if the request didnt match any
        ## response then we need to send it 404
        xhr.respond 404, {}, ""

        return @

      @fakeServer.addRequest = _.wrap @fakeServer.addRequest, (orig, xhr) ->
        ## call the original addRequest method
        orig.call @, xhr

        ## overload the xhr's onsend method so we log out when the request happens
        xhr.onSend = _.wrap xhr.onSend, (orig) ->

          ## push this into our requests array
          _this.requests.push xhr

          ## invokes onRequest callback function on any matching responses
          ## and then also calls this on any global onRequest methods on
          ## our server
          _this.invokeOnRequest(xhr)

          ## call the original so sinon does its thing
          orig.call(@)

        xhr.respond = _.wrap xhr.respond, (orig, args...) ->
          ## return here if we have already responded
          ## this can happen if we are delaying the actual
          ## response but call respond multiple times
          return if xhr.isResponding

          ## we are now responding to this xhr
          ## so do not allow a 2nd respond to come through
          ## on this request
          xhr.isResponding = true

          respondCtx = @

          ## if we have a matched route go through that
          ## else just look at the default server options
          ## we may not have a matched route here in case
          ## of a 404 where we did not stub that route
          if matchedRoute = xhr.matchedRoute
            ## if auto respond is true, set a delay, else do not add any additional delay
            delay = if matchedRoute.respond then matchedRoute.delay else 0
          else
            ## this is used for 404 routes so they are delayed like regular routes
            delay = if _this._autoRespond then _this._delay else 0

          p = Promise
            .delay(delay)
            .cancellable()
            .then ->
              orig.apply(respondCtx, args)
            .then ->
              if _this.requestDidNotMatchAnyResponses(xhr, args)
                status  = 404
                headers = {}
                body    = ""
              else
                [status, headers, body] = args

              _this.handleAfterResponse xhr, {
                status: status
                headers: headers
                body: body
              }

            ## abort xhr's on cancel
            .catch Promise.CancellationError, (err) ->
              _this.abort(xhr)

            ## continue to bubble up errors
            ## if they happen
            .catch (err) ->
              if _.isFunction(_this.onError)
                _this.onError(xhr, matchedRoute, err)
              else
                throw err

              ## return null here so our callback
              ## functions do not return a new promise
              null

            ## always return back the xhr
            .return(xhr)

          ## this promise becomes accessible not only to our tests
          ## but also allows us to cancel outstanding responses
          ## when we abort cypress
          _this.queue.push(p)

        return xhr

    ## need to find the onRequest based on the matching response
    ## this loops through all the responses, finds the matching one
    ## and calls onRequest on it
    ## also invokes onRequest on our global server object
    invokeOnRequest: (xhr) ->

      beforeRequest = (xhr, route) =>
        if _.isFunction @beforeRequest
          @beforeRequest(xhr, route)

      ## have to do this ugly variable juggling to bail
      ## out of the loop early so our onRequest is called
      ## only 1 time in case multiple requests match

      ## also sinon loops over responses in reverse so that
      ## later responses which are added to the server are
      ## matched first before earlier matching ones. this makes
      ## a lot of sense since new responses that you've added
      ## later would cancel out previous ones.
      found = false
      for response in (@fakeServer.responses or []) by -1
        break if found

        response.response xhr, (route) ->
          found = true
          beforeRequest(xhr, route)
          route.onRequest.call(xhr, xhr)

      ## else we didnt find anything
      if not found
        beforeRequest(xhr)

      ## call each onRequest callback with our xhr object
      _.each @onRequests, (onRequest) ->
        onRequest.call(xhr, xhr)

    requestDidNotMatchAnyResponses: (request, args) ->
      [status, headers, body] = args

      status is 404 and _.isEqual(headers, {}) and body is ""

    handleAfterResponse: (request, response) =>
      ## since we emit the options as the response
      ## lets push this into our responses for accessibility
      ## and testability
      @responses.push response

      if _.isFunction(@afterResponse)
        @afterResponse(request, request.matchedRoute)

    stub: (originalOptions = {}) ->
      _.defaults originalOptions,
        delay: @_delay
        respond: @_autoRespond

      options = _(originalOptions).clone()

      _.defaults options,
        contentType: "application/json"
        headers: {}
        alias: null
        onRequest: ->
        onResponse: ->

      @fakeServer.respondWith (request, fn) =>
        return if request.readyState is 4

        if @requestMatchesResponse request, options
          request.matchedRoute = originalOptions

          @setRequestJSON(request)

          ## if we're looking up the options for a matching response
          ## then bail early and return the options into our callback
          return fn(options) if fn

          headers = _.extend options.headers, { "Content-Type": options.contentType }

          ## only respond to the request if respond is true
          ## or if we've forcibly told our server to respond
          if @forceRespond or originalOptions.respond
            request.respond(options.status, headers, @parseResponse(options))
          else
            @fakeServer.queue.push(request)

          return true

    setRequestJSON: (request) ->
      return if not _.str.include(request.requestHeaders.Accept, "application/json")

      try
        request.requestJSON = JSON.parse(request.requestBody)

    requestMatchesResponse: (request, options) ->
      request.method is options.method and
        if _.isRegExp(options.url) then options.url.test(request.url) else options.url is request.url

    parseResponse: (options) ->
      response = _.result options, "response"

      return response if _.isString(response)

      JSON.stringify(response)

    respond: ->
      @forceRespond = true
      @fakeServer.respond()
      @forceRespond = false

      Promise.all(@queue)

    onRequest: (fn) ->
      @onRequests.push fn

    respondImmediately: (bool = true) ->
      @fakeServer.respondImmediately = bool

    ignore: (bool) ->
      @fakeServer.xhr.useFilters = bool

    onFilter: (fn) ->
      @fakeServer.xhr.addFilter(fn)

    abort: (xhr) ->
      xhr.sendFlag = false
      xhr.abort()

    cancel: ->
      if @fakeServer
        ## abort anything in our queue since
        ## those are xhr's which have been responded to
        _.each @fakeServer.queue, @abort

      _.invoke @queue, "cancel"

    restore: ->
      ## aggressively clean up all of this memory
      ## so we force GC early and often
      if @fakeServer
        delete @fakeServer.processRequest
        delete @fakeServer.addRequest
        delete @fakeServer.requests
        delete @fakeServer.responses
        delete @fakeServer.queue

      for array in [@queue, @requests, @responses, @onRequests]
        array.splice(0, array.length)

      for prop in "beforeRequest handleAfterResponse afterResponse onError onFilter fakeServer".split(" ")
        @[prop] = null

      return @

    @create = (server, options) ->
      new $Server(server, options)

  return $Server