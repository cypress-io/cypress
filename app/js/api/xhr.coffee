## attach to Eclectus global
Eclectus.Xhr = do ($, _) ->

  methods = ["stub", "get", "post", "put", "patch", "delete", "respond", "onRequest", "requests"]

  class Xhr
    constructor: (@server, @channel, @runnable) ->
      ## make sure to reset this on restore()
      @requests = []

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

          xhr.instanceId = _.uniqueId("xhrInstance")

          _this.channel.trigger "xhr", _this.runnable,
            instanceId: xhr.instanceId
            method:     xhr.method
            url:        xhr.url
            xhr:        xhr
            isParent:   true

        return xhr

    stub: (options = {}) ->
      _.defaults options,
        url: /.*/
        method: "GET"
        status: 200
        contentType: "application/json"
        response: ""
        headers: {}

      @server.respondWith (request) =>
        return if request.readyState is 4

        if @requestMatchesResponse request, options
          headers = _.extend options.headers, { "Content-Type": options.contentType }

          response =
            status: options.status
            headers: headers
            body: @parseResponse(options)

          request.respond(response.status, response.headers, response.body)

          @channel.trigger "xhr", @runnable,
            instanceId: request.instanceId
            method:     request.method
            url:        request.url
            xhr:        request

    requestMatchesResponse: (request, options) ->
      request.method is options.method and
        if _.isRegExp(options.url) then options.url.test(request.url) else options.url is request.url

    parseResponse: (options) ->
      response = _.result options, "response"

      return response if _.isString(response)

      JSON.stringify(response)

    get: (options = {}) ->
    post: (options = {}) ->
    put: (options = {}) ->
    patch: (options = {}) ->
    delete: (options = {}) ->
    onRequest: (options = {}) ->
    respond: -> @server.respond()

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