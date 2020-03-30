_ = require("lodash")
Promise = require("bluebird")

$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")
$Server = require("../../cypress/server")
$Location = require("../../cypress/location")

server = null

tryDecodeUri = (uri) ->
  try
    return decodeURI(uri)
  catch
    return uri

getServer = ->
  server ? unavailableErr()

cancelPendingXhrs = ->
  if server
    server.cancelPendingXhrs()

  return null

reset = ->
  if server
    server.restore()

  server = null

isUrlLikeArgs = (url, response) ->
  (not _.isObject(url) and not _.isObject(response)) or
    (_.isRegExp(url) or _.isString(url))

getUrl = (options) ->
  options.originalUrl or options.url

unavailableErr = ->
  $errUtils.throwErrByPath("server.unavailable")

getDisplayName = (route) ->
  if route and route.response? then "xhr stub" else "xhr"

stripOrigin = (url) ->
  location = $Location.create(url)
  url.replace(location.origin, "")

getXhrServer = (state) ->
  state("server") ? unavailableErr()

setRequest = (state, xhr, alias) ->
  requests = state("requests") ? []

  requests.push({
    xhr: xhr
    alias: alias
  })

  state("requests", requests)

setResponse = (state, xhr) ->
  obj = _.find(state("requests"), { xhr })

  ## if we've been reset between tests and an xhr
  ## leaked through, then we may not be able to associate
  ## this response correctly
  return if not obj

  index = state("requests").indexOf(obj)

  responses = state("responses") ? []

  ## set the response in the same index as the request
  ## so we can later wait on this specific index'd response
  ## else its not deterministic
  responses[index] = {
    xhr: xhr
    alias: obj?.alias
  }

  state("responses", responses)

startXhrServer = (cy, state, config) ->
  logs = {}

  server = $Server.create({
    xhrUrl: config("xhrUrl")
    stripOrigin: stripOrigin

    ## shouldnt these stubs be called routes?
    ## rename everything related to stubs => routes
    onSend: (xhr, stack, route) =>
      alias = route?.alias

      setRequest(state, xhr, alias)

      if rl = route and route.log
        numResponses = rl.get("numResponses")
        rl.set "numResponses", numResponses + 1

      logs[xhr.id] = log = Cypress.log({
        message:   ""
        name:      "xhr"
        displayName: getDisplayName(route)
        alias:     alias
        aliasType: "route"
        type:      "parent"
        event:     true
        consoleProps: =>
          consoleObj = {
            Alias:         alias
            Method:        xhr.method
            URL:           xhr.url
            "Matched URL": route?.url
            Status:        xhr.statusMessage
            Duration:      xhr.duration
            "Stubbed":     if route and route.response? then "Yes" else "No"
            Request:       xhr.request
            Response:      xhr.response
            XHR:           xhr._getXhr()
          }

          if route and route.is404
            consoleObj.Note = "This request did not match any of your routes. It was automatically sent back '404'. Setting cy.server({force404: false}) will turn off this behavior."

          consoleObj.groups = ->
            [
              {
                name: "Initiator"
                items: [stack]
                label: false
              }
            ]

          consoleObj
        renderProps: ->
          status = switch
            when xhr.aborted
              indicator = "aborted"
              "(aborted)"
            when xhr.canceled
              indicator = "aborted"
              "(canceled)"
            when xhr.status > 0
              xhr.status
            else
              indicator = "pending"
              "---"

          indicator ?= if /^2/.test(status) then "successful" else "bad"

          return {
            indicator,
            message: "#{xhr.method} #{status} #{stripOrigin(xhr.url)}"
          }
      })

      log.snapshot("request")

    onLoad: (xhr) =>
      setResponse(state, xhr)

      if log = logs[xhr.id]
        log.snapshot("response").end()

    onNetworkError: (xhr) ->
      err = $errUtils.cypressErrByPath("xhr.network_error")

      if log = logs[xhr.id]
        log.snapshot("failed").error(err)

    onFixtureError: (xhr, err) ->
      err = $errUtils.cypressErr(err)

      @onError(xhr, err)

    onError: (xhr, err) ->
      err.onFail = ->

      if log = logs[xhr.id]
        log.snapshot("error").error(err)

      ## re-throw the error since this came from AUT code, and needs to
      ## cause an 'uncaught:exception' event. This error will be caught in
      ## top.onerror with stack as 5th argument.
      throw err

    onXhrAbort: (xhr, stack) =>
      setResponse(state, xhr)

      err = new Error $errUtils.errMsgByPath("xhr.aborted")
      err.name = "AbortError"
      err.stack = stack

      if log = logs[xhr.id]
        log.snapshot("aborted").error(err)

    onXhrCancel: (xhr) ->
      setResponse(state, xhr)

      if log = logs[xhr.id]
        log.snapshot("canceled").set({
          ended: true,
          state: "failed"
        })

    onAnyAbort: (route, xhr) =>
      if route and _.isFunction(route.onAbort)
        route.onAbort.call(cy, xhr)

    onAnyRequest: (route, xhr) =>
      if route and _.isFunction(route.onRequest)
        route.onRequest.call(cy, xhr)

    onAnyResponse: (route, xhr) =>
      if route and _.isFunction(route.onResponse)
        route.onResponse.call(cy, xhr)
  })

  win = state("window")

  server.bindTo(win)

  state("server", server)

  return server

defaults = {
  method: undefined
  status: undefined
  delay: undefined
  headers: undefined ## response headers
  response: undefined
  autoRespond: undefined
  waitOnResponses: undefined
  onAbort: undefined
  onRequest: undefined ## need to rebind these to 'cy' context
  onResponse: undefined
}

module.exports = (Commands, Cypress, cy, state, config) ->
  reset()

  ## if our page is going away due to
  ## a form submit / anchor click then
  ## we need to cancel all pending
  ## XHR's so the command log displays
  ## correctly
  Cypress.on("window:unload", cancelPendingXhrs)

  Cypress.on "test:before:run", ->
    ## reset the existing server
    reset()

    ## create the server before each test run
    ## its possible for this to fail if the
    ## last test we ran ended with an invalid
    ## window such as if the last test ended
    ## with a cross origin window
    try
      server = startXhrServer(cy, state, config)
    catch err
      ## in this case, just don't bind to the server
      server = null

    return null

  Cypress.on "window:before:load", (contentWindow) ->
    if server
      ## dynamically bind the server to whatever is currently running
      server.bindTo(contentWindow)
    else
      ## if we don't have a server such as the case when
      ## the last window was cross origin, try to bind
      ## to it now
      server = startXhrServer(cy, state, config)

  Commands.addAll({
    server: (options) ->
      if arguments.length is 0
        options = {}

      if not _.isObject(options)
        $errUtils.throwErrByPath("server.invalid_argument")

      _.defaults options,
        enable: true ## set enable to false to turn off stubbing

      ## if we disable the server later make sure
      ## we cannot add cy.routes to it
      state("serverIsStubbed", options.enable)

      getXhrServer(state).set(options)

    route: (args...) ->
      ## TODO:
      ## if we return a function which returns a promise
      ## then we should be handling potential timeout issues
      ## just like cy.then does

      ## method / url / response / options
      ## url / response / options
      ## options

      ## by default assume we have a specified
      ## response from the user
      hasResponse = true

      if not state("serverIsStubbed")
        $errUtils.throwErrByPath("route.failed_prerequisites")

      ## get the default options currently set
      ## on our server
      options = o = getXhrServer(state).getOptions()

      ## enable the entire routing definition to be a function
      parseArgs = (args...) ->
        switch
          when _.isObject(args[0]) and not _.isRegExp(args[0])
            ## we dont have a specified response
            if not _.has(args[0], "response")
              hasResponse = false

            options = o = _.extend {}, options, args[0]

          when args.length is 0
            $errUtils.throwErrByPath "route.invalid_arguments"

          when args.length is 1
            o.url = args[0]

            hasResponse = false

          when args.length is 2
            ## if our url actually matches an http method
            ## then we know the user doesn't want to stub this route
            if _.isString(args[0]) and $utils.isValidHttpMethod(args[0])
              o.method = args[0]
              o.url    = args[1]

              hasResponse = false
            else
              o.url      = args[0]
              o.response = args[1]

          when args.length is 3
            if $utils.isValidHttpMethod(args[0]) or isUrlLikeArgs(args[1], args[2])
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

        _.defaults(options, defaults)

        if not options.url
          $errUtils.throwErrByPath "route.url_missing"

        if not (_.isString(options.url) or _.isRegExp(options.url))
          $errUtils.throwErrByPath "route.url_invalid"

        if not $utils.isValidHttpMethod(options.method)
          $errUtils.throwErrByPath "route.method_invalid", {
            args: { method: o.method }
          }

        if hasResponse and not options.response?
          $errUtils.throwErrByPath "route.response_invalid"

        ## convert to wildcard regex
        if options.url is "*"
          options.originalUrl = "*"
          options.url = /.*/

        ## look ahead to see if this
        ## command (route) has an alias?
        if alias = cy.getNextAlias()
          options.alias = alias

        if _.isFunction(o.response)
          getResponse = =>
            o.response.call(state("runnable").ctx, options)

          ## allow route to return a promise
          Promise.try(getResponse)
          .then (resp) ->
            options.response = resp

            route()
        else
          route()

      route = ->
        ## if our response is a string and
        ## a reference to an alias
        if _.isString(o.response) and aliasObj = cy.getAlias(o.response, "route")
          ## reset the route's response to be the
          ## aliases subject
          options.response = aliasObj.subject

        url = getUrl(options)

        urlString = url.toString()

        ## https://github.com/cypress-io/cypress/issues/2372
        if (decodedUrl = tryDecodeUri(urlString)) and urlString != decodedUrl
          $errUtils.warnByPath("route.url_percentencoding_warning", { args: { decodedUrl }})

        options.log = Cypress.log({
          name: "route"
          instrument: "route"
          method:   options.method
          url:      getUrl(options)
          status:   options.status
          response: options.response
          alias:    options.alias
          isStubbed: options.response?
          numResponses: 0
          consoleProps: ->
            Method:   options.method
            URL:      url
            Status:   options.status
            Response: options.response
            Alias:    options.alias
        })

        return getXhrServer(state).route(options)

      if _.isFunction(args[0])
        getArgs = =>
          args[0].call(state("runnable").ctx)

        Promise.try(getArgs)
        .then(parseArgs)
      else
        parseArgs(args...)
  })
