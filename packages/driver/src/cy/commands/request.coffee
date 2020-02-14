_ = require("lodash")
whatIsCircular = require("@cypress/what-is-circular")
Promise = require("bluebird")

$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")
$Location = require("../../cypress/location")

isOptional = (memo, val, key) ->
  if _.isNull(val)
    memo.push(key)
  memo

REQUEST_DEFAULTS = {
  url: ""
  method: "GET"
  qs: null
  body: null
  auth: null
  headers: null
  json: null
  form: null
  gzip: true
  timeout: null
  followRedirect: true
  failOnStatusCode: true
  retryOnNetworkFailure: true
  retryOnStatusCodeFailure: false
}

REQUEST_PROPS = _.keys(REQUEST_DEFAULTS)

OPTIONAL_OPTS = _.reduce(REQUEST_DEFAULTS, isOptional, [])

hasFormUrlEncodedContentTypeHeader = (headers) ->
  header = _.findKey(headers, _.matches("application/x-www-form-urlencoded"))

  header and _.toLower(header) is "content-type"

isValidJsonObj = (body) ->
  _.isObject(body) and not _.isFunction(body)

whichAreOptional = (val, key) ->
  val is null and key in OPTIONAL_OPTS

needsFormSpecified = (options = {}) ->
  { body, json, headers } = options

  ## json isn't true, and we have an object body and the user
  ## specified that the content-type header is x-www-form-urlencoded
  json isnt true and _.isObject(body) and hasFormUrlEncodedContentTypeHeader(headers)

module.exports = (Commands, Cypress, cy, state, config) ->
  # Cypress.extend
  #   ## set defaults for all requests?
  #   requestDefaults: (options = {}) ->

  Commands.addAll({
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
          if $utils.isValidHttpMethod(args[0])
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

      _.defaults(options, REQUEST_DEFAULTS, {
        log: true
      })

      ## if timeout is not supplied, use the configured default
      options.timeout ||= config("responseTimeout")

      options.method = options.method.toUpperCase()

      if options.retryOnStatusCodeFailure and not options.failOnStatusCode
        $errUtils.throwErrByPath("request.status_code_flags_invalid")

      if _.has(options, "failOnStatus")
        $errUtils.warnByPath("request.failonstatus_deprecated_warning")
        options.failOnStatusCode = options.failOnStatus

      ## normalize followRedirects -> followRedirect
      ## because we are nice
      if _.has(options, "followRedirects")
        options.followRedirect = options.followRedirects

      if not $utils.isValidHttpMethod(options.method)
        $errUtils.throwErrByPath("request.invalid_method", {
          args: { method: o.method }
        })

      if not options.url
        $errUtils.throwErrByPath("request.url_missing")

      if not _.isString(options.url)
        $errUtils.throwErrByPath("request.url_wrong_type")

      ## normalize the url by prepending it with our current origin
      ## or the baseUrl
      ## or just using the options.url if its FQDN
      ## origin may return an empty string if we haven't visited anything yet
      options.url = $Location.normalize(options.url)

      if originOrBase = config("baseUrl") or cy.getRemoteLocation("origin")
        options.url = $Location.qualifyWithBaseUrl(originOrBase, options.url)

      ## Make sure the url unicode characters are properly escaped
      ## https://github.com/cypress-io/cypress/issues/5274
      try
        options.url = new URL(options.url).href
      catch err
        if !(err instanceof TypeError) ## unexpected, new URL should only throw TypeError
          throw err

        # The URL object cannot be constructed because of URL failure
        $errUtils.throwErrByPath("request.url_invalid", {
          args: {
            configFile: Cypress.config("configFile")
          }
        })


      ## if options.url isnt FQDN then we need to throw here
      ## if we made a request prior to a visit then it needs
      ## to be filled out
      if not $Location.isFullyQualifiedUrl(options.url)
        $errUtils.throwErrByPath("request.url_invalid", {
          args: {
            configFile: Cypress.config("configFile")
          }
        })

      ## if a user has `x-www-form-urlencoded` content-type set
      ## with an object body, they meant to add 'form: true'
      ## so we are nice and do it for them :)
      ## https://github.com/cypress-io/cypress/issues/2923
      if needsFormSpecified(options)
        options.form = true

      if _.isObject(options.body) and path = whatIsCircular(options.body)
        $errUtils.throwErrByPath("request.body_circular", { args: { path }})

      ## only set json to true if form isnt true
      ## and we have a valid object for body
      if options.form isnt true and isValidJsonObj(options.body)
        options.json = true

      options = _.omitBy(options, whichAreOptional)

      if a = options.auth
        if not _.isObject(a)
          $errUtils.throwErrByPath("request.auth_invalid")

      if h = options.headers
        if _.isObject(h)
          options.headers = h
        else
          $errUtils.throwErrByPath("request.headers_invalid")

      if not _.isBoolean(options.gzip)
        $errUtils.throwErrByPath("request.gzip_invalid")

      if f = options.form
        if not _.isBoolean(f)
          $errUtils.throwErrByPath("request.form_invalid")

      ## clone the requestOpts and reduce them down
      ## to the bare minimum to send to lib/request
      requestOpts = _.pick(options, REQUEST_PROPS)

      if options.log
        options._log = Cypress.log({
          message: ""
          consoleProps: ->
            resp = options.response ? {}
            rr   = resp.allRequestResponses ? []

            obj = {}

            word = $utils.plural(rr.length, "Requests", "Request")

            ## if we have only a single request/response then
            ## flatten this to an object, else keep as array
            rr = if rr.length is 1 then rr[0] else rr

            obj[word] = rr
            obj["Yielded"] = _.pick(resp, "status", "duration", "body", "headers")

            return obj

          renderProps: ->
            status = switch
              when r = options.response
                r.status
              else
                indicator = "pending"
                "---"

            indicator ?= if options.response?.isOkStatusCode then "successful" else "bad"

            {
              message: "#{options.method} #{status} #{options.url}"
              indicator: indicator
            }
        })

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      cy.clearTimeout("http:request")

      Cypress.backend("http:request", requestOpts)
      .timeout(options.timeout)
      .then (response) =>
        options.response = response

        ## bomb if we should fail on non okay status code
        if options.failOnStatusCode and response.isOkStatusCode isnt true
          $errUtils.throwErrByPath("request.status_invalid", {
            onFail: options._log
            args: {
              method:          requestOpts.method
              url:             requestOpts.url
              requestBody:     response.requestBody
              requestHeaders:  response.requestHeaders
              status:          response.status
              statusText:      response.statusText
              responseBody:    response.body
              responseHeaders: response.headers
              redirects:       response.redirects
            }
          })

        return response
      .catch Promise.TimeoutError, (err) =>
        $errUtils.throwErrByPath("request.timed_out", {
          onFail: options._log
          args: {
            url:     requestOpts.url
            method:  requestOpts.method
            timeout: options.timeout
          }
        })
      .catch { backend: true }, (err) ->
        $errUtils.throwErrByPath("request.loading_failed", {
          onFail: options._log
          args: {
            error:   err.message
            stack:   err.stack
            method:  requestOpts.method
            url:     requestOpts.url
          },
          noStackTrace: true
        })
  })
