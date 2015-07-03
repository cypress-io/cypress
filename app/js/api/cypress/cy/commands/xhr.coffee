$Cypress.register "XHR", (Cypress, _, $) ->

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/
  nonAjaxAssets      = /\.(js|html|css)$/
  validAliasApi      = /^(\d+|all)$/
  requestXhr         = /\.request$/

  SERVER     = "server"
  TMP_SERVER = "tmpServer"
  TMP_ROUTES = "tmpRoutes"

  Cypress.on "abort", ->
    if server = @prop("server")
      server.abort()

  ## need to upgrade our server
  ## to allow for a setRequest hook
  ## to get the difference between
  ## pending and not pending we just
  ## need to look at the diff between
  ## prop(requests) and prop(responses)
  setRequest = (xhr, alias) ->
    requests = @prop("requests") ? []

    xhr.alias = alias
    requests.push(xhr)

    @prop("requests", requests)

  setResponse = (xhr, alias) ->
    alias ?= "anonymous"
    responses = @prop("responses") ? []

    xhr.alias = alias
    responses.push(xhr)

    @prop("responses", responses)

  ## need to catalog both requests + responses
  ## so we know how many are pending, whether
  ## a request has had a response, etc
  # responseNamespace = (alias) -> "response_" + alias

  startServer = (options) ->
    ## get a handle on our sandbox
    sandbox = @_getSandbox()

    ## start up the fake server to slurp up
    ## any XHR requests from here on out
    server = sandbox.useFakeServer()

    ## pass in our server + options and store this
    ## this server so we can access it later
    @prop SERVER, Cypress.Server.create(server, options)

  stubRoute = (options, server) ->
    server ?= @prop(SERVER)

    server.stub(options)

    getUrl = (options) ->
      options.originalUrl or options.url

    # getMessage = (options) ->
    #   [
    #     options.method,
    #     "[i]" + options.status + "[/i]",
    #     ""
    #   ].join(" - ")

    ## do not mutate existing availableUrls
    urls = @prop("availableUrls") ? []
    urls = urls.concat getUrl(options)
    @prop "availableUrls", urls

    options.log = Cypress.Log.route
      method:   options.method
      url:      getUrl(options)
      status:   options.status
      response: options.response
      alias:    options.alias
      numResponses: 0
      onConsole: ->
        Method:   options.method
        URL:      getUrl(options)
        Status:   options.status
        Response: options.response
        Alias:    options.alias
      onRender: ($row) ->
        debugger
      #   html = $row.html()
      #   html = Cypress.Utils.convertHtmlTags(html)

      #   ## append the URL separately so we dont
      #   ## accidentally convert a regex to an html tag
      #   $row
      #     .html(html)
      #       .find(".command-message")
      #         .children()
      #           .append("<samp>" + getUrl(options) + "</samp>")

    return server

  Cypress.addParentCommand
    server: (args...) ->
      getResponse = (xhr) ->
        ## if request was for JSON
        ## and this isnt valid JSON then
        ## we should prob throw a very
        ## specific error
        try
          JSON.parse(xhr.responseText)
        catch
          xhr.responseText

      log = (xhr, route, err) =>
        ## does the xhr already
        ## have a previous command log
        ## reference?
        if l = xhr.log
          ## if we have an error just return
          return if l.get("error")

          ## resnapshot
          l.snapshot()

          ## increment the associated ROUTE LOG numResponses by 1
          ## (this increments the route instrument)
          if rl = route.log
            numResponses = rl.get("numResponses")
            rl.set "numResponses", numResponses + 1

          ## err if we have an error
          ## else just ends
          if err
            l.error(err)
          else
            l.end()

        else
          alias = route.alias

          if _.isEmpty(route)
            availableUrls = @prop("availableUrls") or []

          ## assign this existing command
          ## to the xhr so we can reuse it later
          xhr.log = Cypress.Log.command
            name:      "xhr"
            alias:     alias
            aliasType: "route"
            type:      "parent"
            error:     err
            snapshot:  true
            event:     true
            onConsole: =>
              consoleObj = {
                Method:        xhr.method
                URL:           xhr.url
                "Matched URL": route.url
                Status:        xhr.status
                Response:      getResponse(xhr)
                Alias:         alias
                Request:       xhr
              }

              ## TODO: TEST THIS
              if _.isEmpty(route)
                _.extend consoleObj,
                  Reason: "The URL for request did not match any of your route(s).  It's response was automatically sent back a 404."
                  "Route URLs": availableUrls

              consoleObj
            onRender: ($row) ->
              status = if xhr.status > 0 then xhr.status else "---"

              klass = switch status
                when "---"
                  "pending"
                else
                  if /^2/.test(status) then "successful" else "bad"

              $row.find(".command-message").html ->
                [
                  "<i class='fa fa-circle #{klass}'></i>" + xhr.method,
                  status,
                  _.truncate(xhr.url, "20")
                ].join(" ")

      defaults = {
        ignore: true
        respond: true
        delay: 10
        onFilter: (method, url, async, username, password) ->
          ## filter out this request (let it go through)
          ## if this is a GET for a nonAjaxAsset
          method is "GET" and nonAjaxAssets.test(url)

        onError: (xhr, route, err) =>
          err.onFail = ->

          log(xhr, route, err)

          @fail(err)

        beforeRequest: (xhr, route = {}) =>
          alias = route.alias

          setRequest.call(@, xhr, alias)

          ## log out this request immediately
          log(xhr, route)

        afterResponse: (xhr, route = {}) =>
          alias = route.alias

          ## set this response xhr object if we
          ## have an alias for it
          setResponse.call(@, xhr, alias) #if alias

          log(xhr, route)
      }

      ## server accepts multiple signatures
      ## so lets normalize the arguments
      switch
        when not args.length
          options = {}
        when _.isFunction(args[0])
          options = {
            onRequest: args[0]
            onResponse: args[1]
          }
        when _.isObject(args[0])
          options = args[0]
        else
          @throwErr(".server() only accepts a single object literal or 2 callback functions!")

      _.defaults options, defaults

      try
        startServer.call(@, options)
      catch
        @prop TMP_SERVER, =>
          startServer.call(@, options)

        return null

    route: (args...) ->
      ## bail if we dont have a server prop or a tmpServer prop
      if not server = @prop("server") or tmpServer = @prop(TMP_SERVER)
        @throwErr("cy.route() cannot be invoked before starting the cy.server()")

      responseMissing = =>
        @throwErr "cy.route() must be called with a response."

      defaults = {
        method: "GET"
        status: 200
        # delay: null
        # respond: true
      }

      options = o = {}

      switch
        when _.isObject(args[0]) and not _.isRegExp(args[0])
          _.extend options, args[0]
        when args.length is 0
          @throwErr "cy.route() must be given a method, url, and response."
        when args.length is 1
          responseMissing()
        when args.length is 2
          o.url        = args[0]
          o.response   = args[1]

          ## if our url actually matches an http method
          ## then we know the user omitted response
          if _.isString(o.url) and validHttpMethodsRe.test(o.url.toUpperCase())
            responseMissing()
        when args.length is 3
          if _.isFunction _(args).last()
            o.url       = args[0]
            o.response  = args[1]
            o.onRequest = args[2]
          else
            o.method    = args[0]
            o.url       = args[1]
            o.response  = args[2]
        else
          if _.isFunction _(args).last()
            lastIndex = args.length - 1

            if _.isFunction(args[lastIndex - 1]) and args.length is 4
              o.url        = args[0]
              o.response   = args[1]
              o.onRequest  = args[2]
              o.onResponse = args[3]

            else
              o.method     = args[0]
              o.url        = args[1]
              o.response   = args[2]
              o.onRequest  = args[3]
              o.onResponse = args[4]

      if _.isString(o.method)
        o.method = o.method.toUpperCase()

      _.defaults options, defaults

      if not options.url
        @throwErr "cy.route() must be called with a url. It can be a string or regular expression."

      if not (_.isString(options.url) or _.isRegExp(options.url))
        @throwErr "cy.route() was called with a invalid url. Url must be either a string or regular expression."

      if not validHttpMethodsRe.test(options.method)
        @throwErr "cy.route() was called with an invalid method: '#{o.method}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"

      if not options.response?
        @throwErr "cy.route() cannot accept an undefined or null response. It must be set to something, even an empty string will work."

      ## convert to wildcard regex
      if options.url is "*"
        options.originalUrl = "*"
        options.url = /.*/

      ## look ahead to see if this
      ## command (route) has an alias?
      if alias = @getNextAlias()
        options.alias = alias

      applyRoute = (options) =>
        ## if we have a tmpServer
        if tmpServer
          ## make sure we have tmpRoutes
          tmpRoutes = @prop(TMP_ROUTES)

          if not tmpRoutes
            ## if we dont make them an array
            tmpRoutes = @prop(TMP_ROUTES, [])

          ## push a new callback function
          ## which stubs the routes as soon
          ## as we we have a server
          tmpRoutes.push =>
            stubRoute.call(@, options)
        else
          stubRoute.call(@, options, server)

      ## if our response is a string and
      ## its a fixture signature, then
      ## dont resolve route until we go
      ## fetch our fixture!
      response = options.response
      if _.isString(response)
        if @matchesFixture(response)
          fixture = @parseFixture(response)

          return @sync.fixture(fixture).then (fixture) ->
            ## assign the fixture to our response
            options.response = fixture
            applyRoute(options)
        else
          if aliasObj = @getAlias(response, "route")
            ## reset the route's response to be the
            ## aliases subject
            options.response = aliasObj.subject

        ## now apply the route
        applyRoute(options)
      else
        applyRoute(options)

    respond: ->
      ## bail if we dont have a server prop or a tmpServer prop
      if not server = @prop("server")
        @throwErr("cy.respond() cannot be invoked before starting the cy.server()")

      if not @getPendingRequests().length
        @throwErr("cy.respond() did not find any pending requests to respond to!")

      ## forcibly return null so we dont
      ## pass the resolved promises around
      server.respond().return(null)

  Cypress.Cy.extend
    getPendingRequests: ->
      return [] if not requests = @prop("requests")

      return requests if not responses = @prop("responses")

      _.difference requests, responses

    getCompletedRequests: ->
      @prop("responses") ? []

    checkForServer: (contentWindow) ->
      if fn = @prop(TMP_SERVER)
        fn()

      if routes = @prop(TMP_ROUTES)
        _.each routes, (route) -> route()

      _.each [TMP_SERVER, TMP_ROUTES], (attr) =>
        ## nuke these from cy
        @prop(attr, null)

    _getLastXhrByAlias: (alias, prop) ->
      ## find the last request or response
      ## which hasnt already been used.
      xhrs = @prop(prop) ? []

      ## allow us to handle waiting on both
      ## the request or the response part of the xhr
      privateProp = "_has#{prop}BeenWaitedOn"

      for xhr in xhrs
        ## we want to return the first xhr which has
        ## not already been waited on, and if its alias matches ours
        if !xhr[privateProp] and xhr.alias is alias
          xhr[privateProp] = true
          return xhr

    ## this should actually be getRequestsByAlias
    ## since this will return all requests and not
    ## responses
    getResponsesByAlias: (alias) ->
      [alias, prop] = alias.split(".")

      if prop and not validAliasApi.test(prop)
        @throwErr "'#{prop}' is not a valid alias property. Only 'numbers' or 'all' is permitted."

      if prop is "0"
        @throwErr "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @#{alias}.1"

      # matching = _.where @prop("requests"), {alias: alias}
      matching = _.where @prop("responses"), {alias: alias}

      ## return the whole array if prop is all
      return matching if prop is "all"

      ## else if prop its a digit and we need to return
      ## the 1-based response from the array
      return matching[_.toNumber(prop) - 1] if prop

      ## else return the last matching response
      return _.last(matching)

    getLastXhrByAlias: (alias) ->
      [str, prop] = alias.split(".")

      if prop
        if prop is "request"
          return @_getLastXhrByAlias(str, "requests")
        else
          @throwErr "'#{prop}' is not a valid alias property. Are you trying to ask for the first request? If so write @#{str}.request"

      @_getLastXhrByAlias(alias, "responses")

    getXhrTypeByAlias: (alias) ->
      if requestXhr.test(alias) then "request" else "response"



