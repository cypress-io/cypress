$Cypress.register "XHR2", (Cypress, _) ->

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/i

  server = null

  deactivate = ->
    if server
      server.deactivate()
      server = null

  isUrlLikeArgs = (url, response) ->
    (not _.isObject(url) and not _.isObject(response)) or
      (_.isRegExp(url) or _.isString(url))

  getUrl = (options) ->
    options.originalUrl or options.url

  unavailableErr = ->
    @throwErr("The XHR server is unavailable or missing. This should never happen and likely is a bug. Open an issue if you see this message.")

  getResponse = (xhr) ->
    ## if request was for JSON
    ## and this isnt valid JSON then
    ## we should prob throw a very
    ## specific error
    try
      JSON.parse(xhr.responseText)
    catch
      xhr.responseText

  defaults = {
    method: "GET"
    status: 200
    stub: true
    delay: undefined
    headers: undefined ## response headers
    response: undefined
    autoRespond: undefined
    waitOnResponse: undefined
    onRequest: ->
    onResponse: ->
  }

  Cypress.on "abort", deactivate

  Cypress.on "test:before:hooks", (test) ->
    deactivate()

    server = @startXhrServer(test.id)

  Cypress.on "before:window:load", (contentWindow) ->
    if server
      server.bindTo(contentWindow)
    else
      unavailableErr.call(@)

  Cypress.Cy.extend
    getXhrServer: ->
      @prop("server") ? unavailableErr.call(@)

    startXhrServer: (testId) ->
      logs = {}

      @prop "server", $Cypress.Server2.create({
        testId: testId
        xhrUrl: @private("xhrUrl")
        normalizeUrl: (url) =>
          ## if url is FQDN that starts with our origin
          ## then we need to strip it out
          ## to prevent accidental CORS request
          ## TODO think about changing this from
          ## origin to just being the 'remoteHost' from cookies
          if origin = @_getLocation("origin")
            url.replace(origin, "")
          else
            url

        onSend: (xhr, stack, stub) =>
          availableUrls = @prop("availableUrls") or []

          logs[xhr.id] = Cypress.Log.command({
            message:   ""
            name:      "xhr"
            displayName: if stub then "xhr stub" else "xhr"
            alias:     stub?.alias
            aliasType: "route"
            type:      "parent"
            event:     true
            onConsole: =>
              consoleObj = {
                Method:        xhr.method
                URL:           xhr.url
                "Matched URL": stub.url
                Status:        xhr.status
                Response:      getResponse(xhr)
                Alias:         stub?.alias
                Request:       xhr
              }

              ## TODO: TEST THIS
              if not stub
                _.extend consoleObj,
                  Reason: "The URL for request did not match any of your route(s).  It's response was automatically sent back a 404."
                  "Route URLs": availableUrls

              consoleObj
            onRender: ($row) ->
              status = switch
                when xhr.aborted
                  klass = "aborted"
                  "(aborted)"
                when xhr.status > 0
                  xhr.status
                else
                  klass = "pending"
                  "---"

              klass ?= if /^2/.test(status) then "successful" else "bad"

              $row.find(".command-message").html ->
                [
                  "<i class='fa fa-circle #{klass}'></i>" + xhr.method,
                  status,
                  _.truncate(xhr.url, 20)
                ].join(" ")
          })

        onLoad: (xhr, stub) ->
          if log = logs[xhr.id]
            log.set("foo", "bar").snapshot().end()

        onError: (xhr, err) ->
          if log = logs[xhr.id]
            log.snapshot().error(err)

        onAbort: (xhr, stack) ->
          err = new Error("This XHR was aborted by your code -- check this stack trace below.")
          err.name = "AbortError"
          err.stack = stack

          if log = logs[xhr.id]
            log.snapshot().error(err)
      })

  Cypress.addParentCommand
    server2: (options = {}) ->
      _.defaults options,
        enable: true ## set enable to false to turn off stubbing

      ## if we disable the server later make sure
      ## we cannot add cy.routes to it
      @prop("serverIsStubbed", options.enable)

      @getXhrServer().set(options)

    route2: (args...) ->
      ## method / url / response / options
      ## url / response / options
      ## options

      if not @prop("serverIsStubbed")
        @throwErr("cy.route() cannot be invoked before starting the cy.server()")

      responseMissing = =>
        @throwErr "cy.route() must be called with a response."

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
          if _.isString(o.url) and validHttpMethodsRe.test(o.url)
            responseMissing()

        when args.length is 3
          if validHttpMethodsRe.test(args[0]) or isUrlLikeArgs(args[1], args[2])
            o.method    = args[0]
            o.url       = args[1]
            o.response  = args[2]
          else
            o.url       = args[0]
            o.response  = args[1]

            _.extend o, args[2]

        when args.length is 4
          o.method    = args[0]
          o.url       = args[1]
          o.response  = args[2]

          _.extend o, args[3]

      if _.isString(o.method)
        o.method = o.method.toUpperCase()

      _.defaults options, defaults

      if not options.url
        @throwErr "cy.route() must be called with a url. It can be a string or regular expression."

      if not (_.isString(options.url) or _.isRegExp(options.url))
        @throwErr "cy.route() was called with a invalid url. Url must be either a string or regular expression."

      if not validHttpMethodsRe.test(options.method)
        @throwErr "cy.route() was called with an invalid method: '#{o.method}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"

      if not options.response? and options.respond isnt false
        @throwErr "cy.route() cannot accept an undefined or null response. It must be set to something, even an empty string will work."

      ## convert to wildcard regex
      if options.url is "*"
        options.originalUrl = "*"
        options.url = /.*/

      ## look ahead to see if this
      ## command (route) has an alias?
      if alias = @getNextAlias()
        options.alias = alias

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

      @getXhrServer().stub(options)
