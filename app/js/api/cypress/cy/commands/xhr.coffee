$Cypress.register "XHR", (Cypress, _, $) ->

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/
  nonAjaxAssets      = /\.(js|html|css)$/

  SERVER     = "server"
  TMP_SERVER = "tmpServer"
  TMP_ROUTES = "tmpRoutes"

  responseNamespace = (alias) -> "response_" + alias

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

    Cypress.route
      method:   options.method
      url:      getUrl(options)
      status:   options.status
      response: options.response
      alias:    options.alias
      _route:   options
      onConsole: ->
        Method:   options.method
        URL:      getUrl(options)
        Status:   options.status
        Response: options.response
        Alias:    options.alias
      onRender: ($row) ->
        debugger
      #   html = $row.html()
      #   html = $Cypress.Utils.convertHtmlTags(html)

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
        alias = route.alias

        if _.isEmpty(route)
          availableUrls = @prop("availableUrls") or []

        Cypress.command
          name:      "request"
          alias:     alias
          aliasType: "route"
          type:      "parent"
          error:     err
          _route:    route
          end:       true
          snapshot:  true
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
            klass = if /^2/.test(xhr.status) then "successful" else "bad"

            $row.find(".command-message").html ->
              [
                "<i class='fa fa-circle #{klass}'></i>" + xhr.method,
                xhr.status,
                _.truncate(xhr.url, "20")
              ].join(" ")

      defaults = {
        ignore: true
        autoRespond: true
        autoRespondAfter: 10
        onFilter: (method, url, async, username, password) ->
          ## filter out this request (let it go through)
          ## if this is a GET for a nonAjaxAsset
          method is "GET" and nonAjaxAssets.test(url)
        onError: (xhr, err) =>
          if options = xhr.matchedResponse

            xhr.loggedFailure = true

            ## remove this reference from the xhr
            ## since we already have it as a variable
            delete xhr.matchedResponse

            err.onFail = ->
              log(xhr, options, err)

          @fail(err)
        afterResponse: (xhr, route = {}) =>
          alias = route.alias

          ## set this response xhr object if we
          ## have an alias for it
          @prop(responseNamespace(alias), xhr) if alias

          ## don't relog afterResponse
          ## if we've already logged the
          ## XHR's failure
          if xhr.loggedFailure
            delete xhr.loggedFailure
            return

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

      defaults = {
        method: "GET"
        status: 200
      }

      options = o = {}

      switch
        when _.isObject(args[0]) and not _.isRegExp(args[0])
          _.extend options, args[0]
        when args.length is 2
          o.url        = args[0]
          o.response   = args[1]

          ## if our url actually matches an http method
          ## then we know the user omitted response
          if _.isString(o.url) and validHttpMethodsRe.test(o.url.toUpperCase())
            @throwErr "cy.route() must be called with a response."
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

      ## convert to wildcard regex
      if options.url is "*"
        options.originalUrl = "*"
        options.url = /.*/

      ## look ahead to see if this
      ## command (route) has an alias?
      if alias = @getNextAlias()
        options.alias = alias

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

  $Cypress.Cy.extend
    checkForServer: (contentWindow) ->
      if fn = @prop(TMP_SERVER)
        fn()

      if routes = @prop(TMP_ROUTES)
        _.each routes, (route) -> route()

      _.each [TMP_SERVER, TMP_ROUTES], (attr) =>
        ## nuke these from cy
        @prop(attr, null)

    getResponseByAlias: (alias) ->
      if xhr = @prop(responseNamespace(alias))
        return xhr
