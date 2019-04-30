_ = require("lodash")
Promise = require("bluebird")

$utils = require("../../cypress/utils")
$Location = require("../../cypress/location")

validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/

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
}

REQUEST_PROPS = _.keys(REQUEST_DEFAULTS)

OPTIONAL_OPTS = _.reduce(REQUEST_DEFAULTS, isOptional, [])

argIsHttpMethod = (str) ->
  _.isString(str) and validHttpMethodsRe.test str.toUpperCase()

isValidJsonObj = (body) ->
  _.isObject(body) and not _.isFunction(body)

whichAreOptional = (val, key) ->
  val is null and key in OPTIONAL_OPTS

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

      _.defaults(options, REQUEST_DEFAULTS, {
        log: true,
        failOnStatusCode: true
      })

      ## if timeout is not supplied, use the configured default
      options.timeout ||= config("responseTimeout")

      options.method = options.method.toUpperCase()

      if _.has(options, "failOnStatus")
        $utils.warning("The cy.request() 'failOnStatus' option has been renamed to 'failOnStatusCode'. Please update your code. This option will be removed at a later time.")
        options.failOnStatusCode = options.failOnStatus

      ## normalize followRedirects -> followRedirect
      ## because we are nice
      if _.has(options, "followRedirects")
        options.followRedirect = options.followRedirects

      if not validHttpMethodsRe.test(options.method)
        $utils.throwErrByPath("request.invalid_method", {
          args: { method: o.method }
        })

      if not options.url
        $utils.throwErrByPath("request.url_missing")

      if not _.isString(options.url)
        $utils.throwErrByPath("request.url_wrong_type")

      ## normalize the url by prepending it with our current origin
      ## or the baseUrl
      ## or just using the options.url if its FQDN
      ## origin may return an empty string if we haven't visited anything yet
      options.url = $Location.normalize(options.url)

      if originOrBase = config("baseUrl") or cy.getRemoteLocation("origin")
        options.url = $Location.qualifyWithBaseUrl(originOrBase, options.url)

      ## if options.url isnt FQDN then we need to throw here
      ## if we made a request prior to a visit then it needs
      ## to be filled out
      if not $Location.isFullyQualifiedUrl(options.url)
        $utils.throwErrByPath("request.url_invalid")

      ## only set json to true if form isnt true
      ## and we have a valid object for body
      if options.form isnt true and isValidJsonObj(options.body)
        options.json = true

      options = _.omitBy(options, whichAreOptional)

      if a = options.auth
        if not _.isObject(a)
          $utils.throwErrByPath("request.auth_invalid")

      if h = options.headers
        if _.isObject(h)
          options.headers = h
        else
          $utils.throwErrByPath("request.headers_invalid")

      if not _.isBoolean(options.gzip)
        $utils.throwErrByPath("request.gzip_invalid")

      if f = options.form
        if not _.isBoolean(f)
          $utils.throwErrByPath("request.form_invalid")

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
          $utils.throwErrByPath("request.status_invalid", {
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
        $utils.throwErrByPath "request.timed_out", {
          onFail: options._log
          args: {
            url:     requestOpts.url
            method:  requestOpts.method
            timeout: options.timeout
          }
        }
      .catch { backend: true }, (err) ->
        $utils.throwErrByPath("request.loading_failed", {
          onFail: options._log
          args: {
            error:   err.message
            stack:   err.stack
            method:  requestOpts.method
            url:     requestOpts.url
          }
        })
  })
