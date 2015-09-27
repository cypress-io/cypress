$Cypress.register "Request", (Cypress, _, $) ->

  isOkStatusCodeRe   = /^2/
  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/

  optionalOpts = "body auth headers json cookies".split(" ")

  defaults = {
    log: true
    body: null
    auth: null
    headers: null
    json: false
    cookies: false
    gzip: true
    failOnStatus: true
    method: "GET"
    timeout: 20000
  }

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

      options.method = options.method.toUpperCase()

      if not validHttpMethodsRe.test(options.method)
        @throwErr("cy.request() was called with an invalid method: '#{o.method}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS")

      if not options.url
        @throwErr("cy.request requires a url. You did not provide a url.")

      if not _.isString(options.url)
        @throwErr("cy.request requires the url to be a string.")

      ## normalize the url by prepending it with our current origin
      ## or the baseUrl
      ## or just using the options.url if its FQDN
      ## origin may return an empty string if we haven't visited anything yet
      origin = @_getLocation("origin") or @private("baseUrl")
      options.url = Cypress.Location.getRemoteUrl options.url, origin

      ## if options.url isnt FQDN then we need to throw here
      ## if we made a request prior to a visit then it needs
      ## to be filled out
      if not Cypress.Location.isFullyQualifiedUrl(options.url)
        @throwErr("cy.request must be provided a fully qualified url - one that begins with 'http'. By default cy.request will use either the current window's origin or the 'baseUrl' in cypress.json. Neither of those values were present.")

      if isValidJsonObj(options.body)
        options.json = true

      options = _.omit options, whichAreUntruthyAndOptional

      if a = options.auth
        if not _.isObject(a)
          @throwErr("cy.request must be passed an object literal for the 'auth' option.")

      if h = options.headers
        if _.isObject(h)
          options.headers = h
        else
          @throwErr("cy.request requires headers to be an object literal.")

      if c = options.cookies
        switch
          when _.isObject(c) and not _.isArray(c) and not _.isFunction(c)
            options.cookies = c
          when c is true
            options.cookies = Cypress.Cookies.getAllCookies()
          else
            @throwErr("cy.request requires cookies to be true, or an object literal.")

      if not _.isBoolean(options.gzip)
        @throwErr("cy.request requires gzip to be a boolean.")

      ## clone the requestOpts to prevent
      ## anything from mutating it now
      requestOpts = _(options).pick("method", "url", "body", "headers", "cookies", "json", "auth", "gzip")

      if options.log
        options._log = Cypress.Log.command({
          message: ""
          onConsole: -> {
            Request: requestOpts
            Returned: options.response
          }

          onRender: ($row) ->
            status = switch
              when r = options.response
                r.status
              else
                klass = "pending"
                "---"

            klass ?= if isOkStatusCodeRe.test(status) then "successful" else "bad"

            $row.find(".command-message").html ->
              [
                "<i class='fa fa-circle #{klass}'></i>" + options.method,
                status,
                _.truncate(options.url, 25)
              ].join(" ")
        })

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      @_clearTimeout()

      request(requestOpts)
        .timeout(options.timeout)
        .then (response) =>
          options.response = response

          if err = response.__error
            @throwErr(err, options._log)

          ## bomb if we should fail on non 2xx status code
          if options.failOnStatus and not isOkStatusCodeRe.test(response.status)
            @throwErr("cy.request failed because the response had the status code: #{response.status}", options._log)

          return response
        .catch Promise.TimeoutError, (err) =>
          @throwErr "cy.request timed out waiting '#{options.timeout}ms' for a response. No response ever occured.", options._log
