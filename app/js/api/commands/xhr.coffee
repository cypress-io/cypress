do (Cypress, _) ->

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/

  responseNamespace = (alias) -> "response_" + alias

  Cypress.on "defaults", ->
    @_sandbox = null

  Cypress.on "after:run", ->
    ## restore the sandbox if we've
    ## created one
    if sandbox = @_sandbox
      sandbox.restore()

      ## if we have a server, resets
      ## these references for GC
      if server = sandbox.server
        server.requests  = []
        server.queue     = []
        server.responses = []

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

      log = (xhr, options, err) =>
        alias = options.alias or null

        if options.noMatch
          availableUrls = @prop("availableUrls") or []

        Cypress.command
          name:      "request"
          method:    xhr.method
          url:       "/" + xhr.url.replace(/^\//g, "")
          status:    xhr.status
          message:   null
          aliased:   alias
          alias:     null
          aliasType: "route"
          type:      "parent"
          error:     err
          onConsole: =>
            consoleObj = {
              Method:        xhr.method
              URL:           xhr.url
              "Matched URL": options.url
              Status:        xhr.status
              Response:      getResponse(xhr)
              Alias:         alias
              Request:       xhr
            }

            ## TODO: TEST THIS
            if options.noMatch
              _.extend consoleObj,
                Reason: "The URL for request did not match any of your route(s).  It's response was automatically sent back a 404."
                "Route URLs": availableUrls

            consoleObj

          onRender: ($row) ->
            $row.find(".command-message").html ->
              [
                "<i class='fa fa-circle'></i>" + xhr.method,
                xhr.status,
                _.truncate(xhr.url, "20")
              ].join(" ")

      defaults = {
        autoRespond: true
        autoRespondAfter: 10
        onError: (xhr, err) =>
          if options = xhr.matchedResponse

            xhr.loggedFailure = true

            ## remove this reference from the xhr
            ## since we already have it as a variable
            delete xhr.matchedResponse

            err.onFail = ->
              log(xhr, options, err)

          @fail(err)
        afterResponse: (xhr, options) =>
          alias = options.alias or null

          ## set this response xhr object if we
          ## have an alias for it
          @prop(responseNamespace(alias), xhr) if alias

          ## don't relog afterResponse
          ## if we've already logged the
          ## XHR's failure
          if xhr.loggedFailure
            delete xhr.loggedFailure
            return

          log(xhr, options)
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

      ## get a handle on our sandbox
      sandbox = @_getSandbox()

      ## start up the fake server to slurp up
      ## any XHR requests from here on out
      server = sandbox.useFakeServer()

      ## pass in our server + options and store this
      ## this server so we can access it later
      @prop "server", Cypress.server(server, options)

    route: (args...) ->
      ## bail if we dont have a server prop
      @throwErr("cy.route() cannot be invoked before starting the cy.server()") if not server = @prop("server")

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

  Cypress.extend
    getResponseByAlias: (alias) ->
      if xhr = @prop(responseNamespace(alias))
        return xhr

    _getSandbox: ->
      sinon = @sync.window().sinon

      @throwErr("sinon.js was not found in the remote iframe's window.  This may happen if you testing a page you did not directly cy.visit(..).  This happens when you click a regular link.") if not sinon

      @_sandbox ?= sinon.sandbox.create()