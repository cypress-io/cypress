_ = require("lodash")
Promise = require("bluebird")

$Cy = require("../../cypress/cy")
$Log = require("../../cypress/log")
utils = require("../../cypress/utils")

$Cy.extend({
  _waitNumber: (subject, ms, options) ->
    ## increase the timeout by the delta
    @_timeout(ms, true)

    if options.log isnt false
      options._log = Cypress.Log.command
        consoleProps: -> {
          "Waited For": "#{ms}ms before continuing"
          "Yielded": subject
        }

    Promise
      .delay(ms)
      .return(subject)

  _waitFunction: (subject, fn, options) ->
    utils.throwErrByPath("wait.fn_deprecated")

  _waitString: (subject, str, options) ->
    if options.log isnt false
      log = options._log = Cypress.Log.command
        type: "parent"
        aliasType: "route"

    getNumRequests = (alias) =>
      requests = @state("aliasRequests") ? {}
      requests[alias] ?= 0
      requests[alias] += 1

      @state("aliasRequests", requests)

      _.ordinalize requests[alias]

    checkForXhr = (alias, type, num, options) ->
      options.type = type

      ## append .type to the alias
      xhr = @getLastXhrByAlias(alias + "." + type)

      ## return our xhr object
      return Promise.resolve(xhr) if xhr

      options.error = utils.errMessageByPath "wait.timed_out", {
        timeout: options.timeout
        alias
        num
        type
      }


      args = arguments

      @_retry ->
        args.options = _.omit(options, "timeout")
        checkForXhr.apply(@, args)
      , options

    waitForXhr = (str, options) ->
      ## we always want to strip everything after the first '.'
      ## since we support alias property 'request'
      [str, str2] = str.split(".")

      if not aliasObj = @getAlias(str, "wait", log)
        @aliasNotFoundFor(str, "wait", log)

      ## if this alias is for a route then poll
      ## until we find the response xhr object
      ## by its alias
      {alias, command} = aliasObj

      str = _.compact([alias, str2]).join(".")

      type = @getXhrTypeByAlias(str)

      ## if we have a command then continue to
      ## build up an array of referencesAlias
      ## because wait can reference an array of aliases
      if log
        referencesAlias = log.get("referencesAlias") ? []
        aliases = [].concat(referencesAlias)
        aliases.push(str)
        log.set "referencesAlias", aliases

      if command.get("name") isnt "route"
        utils.throwErrByPath("wait.invalid_alias", {
          onFail: options._log
          args: { alias }
        })

      ## create shallow copy of each options object
      ## but slice out the error since we may set
      ## the error related to a previous xhr
      timeout = options.timeout

      num = getNumRequests(alias)

      waitForRequest = =>
        options = _.omit(options, "_runnableTimeout")
        options.timeout = timeout ? Cypress.config("requestTimeout")
        checkForXhr.call(@, alias, "request", num, options)

      waitForResponse = =>
        options = _.omit(options, "_runnableTimeout")
        options.timeout = timeout ? Cypress.config("responseTimeout")
        checkForXhr.call(@, alias, "response", num, options)

      ## if we were only waiting for the request
      ## then resolve immediately do not wait for response
      if type is "request"
        waitForRequest()
      else
        waitForRequest().then(waitForResponse)

    ## we have to juggle a separate array of promises
    ## in order to cancel them when one bombs
    ## so they dont just keep retrying and retrying
    xhrs = []

    Promise
      .map [].concat(str), (str) =>
        ## we may get back an xhr value instead
        ## of a promise, so we have to wrap this
        ## in another promise :-(
        xhr = Promise.resolve waitForXhr.call(@, str, _.omit(options, "error"))
        xhrs.push(xhr)
        xhr
      .then (responses) ->
        ## if we only asked to wait for one alias
        ## then return that, else return the array of xhr responses
        ret = if responses.length is 1 then responses[0] else responses

        if options._log
          options._log.set "consoleProps", -> {
            "Waited For": (@referencesAlias || []).join(", ")
            "Yielded": ret
          }

          options._log.snapshot().end()

        return ret
      .catch (err) ->
        _(xhrs).invoke("cancel")
        throw err
})

module.exports = (Cypress, Commands) ->
  Commands.addAll({ prevSubject: "optional" }, {
    wait: (subject, msOrFnOrAlias, options = {}) ->
      ## check to ensure options is an object
      ## if its a string the user most likely is trying
      ## to wait on multiple aliases and forget to make this
      ## an array
      if _.isString(options)
        utils.throwErrByPath("wait.invalid_arguments")

      _.defaults options, {log: true}

      args = [subject, msOrFnOrAlias, options]

      throwErr = (arg) ->
        utils.throwErrByPath("wait.invalid_1st_arg", {args: {arg}})

      try
        switch
          when _.isFinite(msOrFnOrAlias)   then @_waitNumber.apply(@, args)
          when _.isFunction(msOrFnOrAlias) then @_waitFunction.apply(@, args)
          when _.isString(msOrFnOrAlias)   then @_waitString.apply(@, args)
          when _.isArray(msOrFnOrAlias) and not _.isEmpty(msOrFnOrAlias)
            @_waitString.apply(@, args)
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
