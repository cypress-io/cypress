$Cypress.register "Request", (Cypress, _, $) ->

  isOkStatusCodeRe   = /^2/
  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/

  optionalOpts = "body auth headers json cookies".split(" ")

  request = (options) =>
    new Promise (resolve) ->
      Cypress.trigger "request", options, resolve

  argIsHttpMethod = (str) ->
    _.isString(str) and validHttpMethodsRe.test str.toUpperCase()

  isValidJsonObj = (body) ->
    _.isObject(body) and not _.isFunction(body)

  whichAreUntruthyAndOptional = (val, key) ->
    !val and key in optionalOpts

  # Cypress.extend
  #   ## set defaults for all requests?
  #   requestDefaults: (options = {}) ->

  Cypress.addParentCommand
    ## allow our signature to be similar to cy.route
    ## METHOD / URL / BODY
    ## or object literal with all expanded options
    request: (args...) ->

      defaults = {
        log: true
        body: null
        auth: null
        headers: null
        json: false
        cookies: false
        failOnStatus: true
        method: "GET"
        timeout: 30000
      }

      options = o = {}

      switch
        when _.isObject(args[0])
          _.extend options, args[0]

        when args.length is 1
          o.url = args[0]

        when args.length is 2
          ## if our first arg is a valid
          ## HTTP method then set method + url
          if argIsHttpMethod(args[0])
            o.method = args[0]
            o.url    = args[1]
          else
            ## set url + body
            o.url    = args[0]
            o.body   = args[1]

        when args.length is 3
          o.method = args[0]
          o.url    = args[1]
          o.body   = args[2]

      _.defaults options, defaults

      if not options.url
        @throwErr("cy.request requires a url be passed.")

      if isValidJsonObj(options.body)
        options.json = true

      options = _.omit options, whichAreUntruthyAndOptional

      if h = options.headers
        if _.isObject(h)
          options.headers = h
        else
          ## throw err

      if c = options.cookies
        switch
          when _.isObject(c)
            options.cookies = c
          when true
            options.cookies = Cypress.Cookies.get()
          else
            ## throw err

      ## clone the requestOpts to prevent
      ## anything from mutating it now
      requestOpts = _(options).pick("auth", "json", "cookies", "method", "headers", "body", "url")

      if options.log
        options._log = Cypress.Log.command({
          onConsole: -> requestOpts
        })

      ## need to remove the current timeout
      ## @_clearTimeout()
      ## normalize this url just like cy.visit

      ## do we need to set this as cancellable?
      request(requestOpts)
        .timeout(options.timeout)
        .then (response) =>
          if err = response.__error
            @throwErr(err)

          ## bomb if we should fail on non 2xx status code
          if options.failOnStatus and not isOkStatusCodeRe.test(response.status)
            @throwErr("cy.request failed because the response had the status code: #{response.status}")

          return response
        .catch Promise.CancellationError, (err) ->
