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
      defaults = {
        autoRespond: true
        autoRespondAfter: 10
        onError: (xhr, err) =>
          console.warn "Responding to this XHR caused the following error to be thrown!", xhr
          @fail(err)
        afterResponse: (xhr, alias) =>
          ## set this response xhr object if we
          ## have an alias for it
          @prop(responseNamespace(alias), xhr) if alias
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
      @throwErr("cy.route() cannot be invoked before starting the cy.server()") if not @prop("server")

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

      @prop("server").stub(options)
      getUrl = (options) ->
        options.originalUrl or options.url

  Cypress.extend
    getResponseByAlias: (alias) ->
      if xhr = @prop(responseNamespace(alias))
        return xhr

    _getSandbox: ->
      sinon = @sync.window().sinon

      @throwErr("sinon.js was not found in the remote iframe's window.  This may happen if you testing a page you did not directly cy.visit(..).  This happens when you click a regular link.") if not sinon

      @_sandbox ?= sinon.sandbox.create()