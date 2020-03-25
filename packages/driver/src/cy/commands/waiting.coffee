_ = require("lodash")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")

getNumRequests = (state, alias) =>
  requests = state("aliasRequests") ? {}
  index = requests[alias] ?= 0

  requests[alias] += 1

  state("aliasRequests", requests)

  [index, _.ordinalize(requests[alias])]

throwErr = (arg) ->
  $errUtils.throwErrByPath("wait.invalid_1st_arg", {args: {arg}})

module.exports = (Commands, Cypress, cy, state, config) ->
  waitFunction = ->
    $errUtils.throwErrByPath("wait.fn_deprecated")

  waitNumber = (subject, ms, options) ->
    ## increase the timeout by the delta
    cy.timeout(ms, true, "wait")

    if options.log isnt false
      options._log = Cypress.log({
        consoleProps: -> {
          "Waited For": "#{ms}ms before continuing"
          "Yielded": subject
        }
      })

    Promise
    .delay(ms, "wait")
    .return(subject)

  waitString = (subject, str, options) ->
    if options.log isnt false
      log = options._log = Cypress.log({
        type: "parent"
        aliasType: "route"
      })

    checkForXhr = (alias, type, index, num, options) ->
      options.type = type

      ## append .type to the alias
      xhr = cy.getIndexedXhrByAlias(alias + "." + type, index)

      ## return our xhr object
      return Promise.resolve(xhr) if xhr

      options.error = $errUtils.errMsgByPath("wait.timed_out", {
        timeout: options.timeout
        alias
        num
        type
      })

      args = arguments

      cy.retry ->
        checkForXhr.apply(window, args)
      , options

    waitForXhr = (str, options) ->
      ## we always want to strip everything after the last '.'
      ## since we support alias property 'request'
      if _.indexOf(str, ".") == -1 ||
      str.slice(1) in _.keys(cy.state("aliases"))
        [str, str2] = [str, null]
      else
        # potentially request, response or index
        allParts = _.split(str, '.')
        [str, str2] = [_.join(_.dropRight(allParts, 1), '.'), _.last(allParts)]

      if not aliasObj = cy.getAlias(str, "wait", log)
        cy.aliasNotFoundFor(str, "wait", log)

      ## if this alias is for a route then poll
      ## until we find the response xhr object
      ## by its alias
      {alias, command} = aliasObj

      str = _.compact([alias, str2]).join(".")

      type = cy.getXhrTypeByAlias(str)

      [ index, num ] = getNumRequests(state, alias)

      ## if we have a command then continue to
      ## build up an array of referencesAlias
      ## because wait can reference an array of aliases
      if log
        referencesAlias = log.get("referencesAlias") ? []
        aliases = [].concat(referencesAlias)

        if str
          aliases.push({
            name: str
            cardinal: index + 1,
            ordinal: num
          })

        log.set "referencesAlias", aliases

      if command.get("name") isnt "route"
        $errUtils.throwErrByPath("wait.invalid_alias", {
          onFail: options._log
          args: { alias }
        })

      ## create shallow copy of each options object
      ## but slice out the error since we may set
      ## the error related to a previous xhr
      timeout = options.timeout
      requestTimeout = options.requestTimeout ? timeout
      responseTimeout = options.responseTimeout ? timeout

      waitForRequest = ->
        options = _.omit(options, "_runnableTimeout")
        options.timeout = requestTimeout ? Cypress.config("requestTimeout")
        checkForXhr(alias, "request", index, num, options)

      waitForResponse = ->
        options = _.omit(options, "_runnableTimeout")
        options.timeout = responseTimeout ? Cypress.config("responseTimeout")
        checkForXhr(alias, "response", index, num, options)

      ## if we were only waiting for the request
      ## then resolve immediately do not wait for response
      if type is "request"
        waitForRequest()
      else
        waitForRequest().then(waitForResponse)

    Promise
    .map [].concat(str), (str) ->
      ## we may get back an xhr value instead
      ## of a promise, so we have to wrap this
      ## in another promise :-(
      waitForXhr(str, _.omit(options, "error"))
    .then (responses) ->
      ## if we only asked to wait for one alias
      ## then return that, else return the array of xhr responses
      ret = if responses.length is 1 then responses[0] else responses

      if log
        log.set "consoleProps", -> {
          "Waited For": (_.map(log.get("referencesAlias"), 'name') || []).join(", ")
          "Yielded": ret
        }

        log.snapshot().end()

      return ret

  Commands.addAll({ prevSubject: "optional" }, {
    wait: (subject, msOrFnOrAlias, options = {}) ->
      ## check to ensure options is an object
      ## if its a string the user most likely is trying
      ## to wait on multiple aliases and forget to make this
      ## an array
      if _.isString(options)
        $errUtils.throwErrByPath("wait.invalid_arguments")

      _.defaults options, {log: true}

      args = [subject, msOrFnOrAlias, options]

      try
        switch
          when _.isFinite(msOrFnOrAlias)
            waitNumber.apply(window, args)
          when _.isFunction(msOrFnOrAlias)
            waitFunction()
          when _.isString(msOrFnOrAlias)
            waitString.apply(window, args)
          when _.isArray(msOrFnOrAlias) and not _.isEmpty(msOrFnOrAlias)
            waitString.apply(window, args)
          else
            ## figure out why this error failed
            arg = switch
              when _.isNaN(msOrFnOrAlias)    then "NaN"
              when msOrFnOrAlias is Infinity then "Infinity"
              when _.isSymbol(msOrFnOrAlias) then msOrFnOrAlias.toString()
              else
                try
                  JSON.stringify(msOrFnOrAlias)
                catch
                  "an invalid argument"

            throwErr(arg)
      catch err
        if err.name is "CypressError"
          throw err
        else
          ## whatever was passed in could not be parsed
          ## by our switch case
          throwErr("an invalid argument")
  })
