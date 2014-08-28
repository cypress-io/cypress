## attach to Eclectus global
Eclectus.Xhr = do ($, _, Eclectus) ->

  methods = ["stub", "get", "post", "put", "patch", "delete", "respond", "requests", "onRequest"]

  class Xhr extends Eclectus.Command
    config:
      type: "xhr"

    initialize: ->
      ## make sure to reset both of these on restore()
      @requests = []
      @onRequests = []

      @canBeParent = true

    setServer: (@server) ->
      _this = @

      @server.addRequest = _.wrap @server.addRequest, (addRequestOrig, xhr) ->

        ## call the original addRequest method
        addRequestOrig.call @, xhr

        ## overload the xhr's onsend method so we log out when the request happens
        xhr.onSend = _.wrap xhr.onSend, (onSendOrig) ->

          ## push this into our requests array
          _this.requests.push xhr

          ## call the original so sinon does its thing
          onSendOrig.call(@)

          xhr.id          = _this.id

          _this.emit
            method:      xhr.method
            url:         xhr.url
            xhr:         xhr

          ## invokes onRequest callback function on any matching responses
          ## and then also calls this on any global onRequest methods on
          ## our server
          _this.invokeOnRequest(xhr)

        return xhr

    ## need to find the onRequest based on the matching response
    ## this loops through all the responses, finds the matching one
    ## and calls onRequest on it
    ## also invokes onRequest on our global server object
    invokeOnRequest: (xhr) ->
      ## have to do this ugly variable juggling to bail
      ## out of the loop early so our onRequest is called
      ## only 1 time in case multiple requests match
      found = false
      for response in @server.responses
        break if found

        response.response xhr, (options) ->
          found = true
          options.onRequest.call(xhr)

      ## call each onRequest callback with our xhr object
      _.each @onRequests, (onRequest) ->
        onRequest.call xhr, xhr

    stub: (options = {}) ->
      throw new Error("Ecl.server.stub() must be called with a method option") if not options.method

      _.defaults options,
        url: /.*/
        status: 200
        contentType: "application/json"
        response: ""
        headers: {}
        onRequest: ->

      @server.respondWith (request, fn) =>
        return if request.readyState is 4

        if @requestMatchesResponse request, options

          ## if we're looking up the options for a matching response
          ## then bail early and return the options into our callback
          return fn(options) if fn

          headers = _.extend options.headers, { "Content-Type": options.contentType }

          response =
            status: options.status
            headers: headers
            body: @parseResponse(options)

          request.respond(response.status, response.headers, response.body)

          ## clone the body and strip out any script tags
          body = @$("body").clone(true, true)
          body.find("script").remove()

          resp = @clone()
          resp.prevObject = @
          resp.canBeParent = false

          resp.emit
            method:       request.method
            url:          request.url
            xhr:          request
            response:     options

    requestMatchesResponse: (request, options) ->
      request.method is options.method and
        if _.isRegExp(options.url) then options.url.test(request.url) else options.url is request.url

    parseResponse: (options) ->
      response = _.result options, "response"

      return response if _.isString(response)

      JSON.stringify(response)

    get: (options = {}) ->
      options.method = "GET"
      @stub options

    post: (options = {}) ->
      options.method = "POST"
      @stub options

    put: (options = {}) ->
      options.method = "PUT"
      @stub options

    patch: (options = {}) ->
      options.method = "PATCH"
      @stub options

    delete: (options = {}) ->
      options.method = "DELETE"
      @stub options

    respond: -> @server.respond()

    onRequest: (fn) ->
      @onRequests.push fn

    ## class method responsible for dynamically binding
    ## our patched obj[property] to the servers proto methods
    @bindServerTo = (obj, property, server) ->
      _.each methods, (method) ->
        ## if the target method on our server instance
        ## is a function, dynamically bind it with the
        ## context of our instance
        if _.isFunction server[method]
          obj[property][method] = _.bind server[method], server
        else
          ## else just set it directly (like @requests array)
          obj[property][method] = server[method]

  return Xhr