$Cypress.register "XHR2", (Cypress, _) ->

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/i
  requestXhrRe       = /\.request$/
  validAliasApiRe    = /^(\d+|all)$/

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

  urlWithoutOrigin = (url) ->
  getDisplayName = (stub) ->
    if stub and stub.stub isnt false then "xhr stub" else "xhr"

    location = Cypress.Location.create(url)
    location.href.replace(location.origin, "")

  setRequest = (xhr, alias) ->
    requests = @prop("requests") ? []

    requests.push({
      xhr: xhr
      alias: alias
    })

    @prop("requests", requests)

  setResponse = (xhr) ->
    obj = _.findWhere @prop("requests"), {xhr: xhr}

    responses = @prop("responses") ? []

    responses.push({
      xhr: xhr
      alias: obj?.alias
    })

    @prop("responses", responses)

  defaults = {
    method: "GET"
    status: 200
    stub: undefined
    delay: undefined
    headers: undefined ## response headers
    response: undefined
    autoRespond: undefined
    waitOnResponses: undefined
    onRequest: undefined ## need to rebind these to 'cy' context
    onResponse: undefined
  }

  Cypress.on "before:unload", ->
    ## if our page is going away due to
    ## a form submit / anchor click then
    ## we need to cancel all outstanding
    ## XHR's so the command log displays
    ## correctly
    if server
      server.abort()

  Cypress.on "abort", deactivate

  Cypress.on "test:before:hooks", (test = {}) ->
    deactivate()

    server = @startXhrServer(test.id)

  Cypress.on "before:window:load", (contentWindow) ->
    if server
      ## should we be restoring the previous
      ## content window here?
      server.bindTo(contentWindow)
    else
      unavailableErr.call(@)

  Cypress.Cy.extend
    getXhrServer: ->
      @prop("server") ? unavailableErr.call(@)

    startXhrServer: (testId) ->
      logs = {}

      cy = @

      @prop "server", $Cypress.Server2.create({
        testId: testId
        xhrUrl: @private("xhrUrl")
        getRemoteUrl: (url) =>
          href = @_getLocation("href")
          Cypress.Location.resolve(href, url)

        normalizeUrl: (url) =>
          ## strip out the origin from the url
          location = Cypress.Location.create(url)
          location.href.replace(location.origin, "")

        onSend: (xhr, stack, stub) =>
          alias = stub?.alias

          setRequest.call(@, xhr, alias)

          availableUrls = @prop("availableUrls") or []

          if sl = stub and stub.log
            numResponses = sl.get("numResponses")
            sl.set "numResponses", numResponses + 1

          logs[xhr.id] = log = Cypress.Log.command({
            message:   ""
            name:      "xhr"
            displayName: getDisplayName(stub)
            alias:     alias
            aliasType: "route"
            type:      "parent"
            event:     true
            onConsole: =>
              consoleObj = {
                Alias:         alias
                Method:        xhr.method
                URL:           xhr.url
                "Matched URL": stub?.url
                Status:        xhr.statusMessage
                Duration:      xhr.duration
                Request:       xhr.request
                Response:      xhr.response
                XHR:           xhr.getXhr()
              }

              if stub and stub.is404
                consoleObj.Note = "The Method + URL for this request did not match any of your routes. It was automatically sent back '404'. Setting {force404: false} will turn off this behavior."

              consoleObj.groups = ->
                [
                  {
                    name: "Initiator"
                    items: [stack]
                    label: false
                  }
                ]

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
                  _.truncate(urlWithoutOrigin(xhr.url), 20)
                ].join(" ")
          })

          log.snapshot("request")

        onLoad: (xhr) =>
          setResponse.call(@, xhr)

          if log = logs[xhr.id]
            log.snapshot("response").end()

        onFixtureError: (xhr, err) ->
          err = cy.cypressErr(err)

          @onError(xhr, err)

        onError: (xhr, err) =>
          err.onFail = ->

          if log = logs[xhr.id]
            log.snapshot().error(err)

          @fail(err)

        onAbort: (xhr, stack) =>
          setResponse.call(@, xhr)

          err = new Error("This XHR was aborted by your code -- check this stack trace below.")
          err.name = "AbortError"
          err.stack = stack

          if log = logs[xhr.id]
            log.snapshot("aborted").error(err)

        onRequest: (stub, xhr) =>
          if stub and _.isFunction(stub.onRequest)
            stub.onRequest.call(@, xhr)

        onResponse: (stub, xhr) =>
          if stub and _.isFunction(stub.onResponse)
            stub.onResponse.call(@, xhr)
      })

  Cypress.addParentCommand
    server: (options) ->
      if arguments.length is 0
        options = {}

      if not _.isObject(options)
        @throwErr("cy.server() accepts only an object literal as its argument!")

      _.defaults options,
        enable: true ## set enable to false to turn off stubbing

      ## if we disable the server later make sure
      ## we cannot add cy.routes to it
      @prop("serverIsStubbed", options.enable)

      @getXhrServer().set(options)

    route: (args...) ->
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

      if not options.response? and options.stub isnt false ## or autoRespond?
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

      ## if our response is a string and
      ## a reference to an alias
      if _.isString(o.response) and aliasObj = @getAlias(o.response, "route")
        ## reset the route's response to be the
        ## aliases subject
        options.response = aliasObj.subject

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

  Cypress.Cy.extend
    getPendingRequests: ->
      return [] if not requests = @prop("requests")

      return requests if not responses = @prop("responses")

      _.difference requests, responses

    getCompletedRequests: ->
      @prop("responses") ? []

    _getLastXhrByAlias: (alias, prop) ->
      ## find the last request or response
      ## which hasnt already been used.
      xhrs = @prop(prop) ? []

      ## allow us to handle waiting on both
      ## the request or the response part of the xhr
      privateProp = "_has#{prop}BeenWaitedOn"

      for obj in xhrs
        ## we want to return the first xhr which has
        ## not already been waited on, and if its alias matches ours
        if !obj[privateProp] and obj.alias is alias
          obj[privateProp] = true
          return obj.xhr

    ## this should actually be getRequestsByAlias
    ## since this will return all requests and not
    ## responses
    getResponsesByAlias: (alias) ->
      [alias, prop] = alias.split(".")

      if prop and not validAliasApiRe.test(prop)
        @throwErr "'#{prop}' is not a valid alias property. Only 'numbers' or 'all' is permitted."

      if prop is "0"
        @throwErr "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @#{alias}.1"

      ## return an array of xhrs
      matching = _(@prop("responses")).chain().where({alias: alias}).pluck("xhr").value()

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
      if requestXhrRe.test(alias) then "request" else "response"
