$Cypress.register "Waiting", (Cypress, _, $, Promise) ->

  Cypress.addDualCommand

    wait: (subject, msOrFnOrAlias, options = {}) ->
      msOrFnOrAlias ?= 1e9

      ## check to ensure options is an object
      ## if its a string the user most likely is trying
      ## to wait on multiple aliases and forget to make this
      ## an array
      if _.isString(options)
        @throwErr("cy.wait() was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array.")

      _.defaults options, {log: true}

      args = [subject, msOrFnOrAlias, options]

      switch
        when _.isNumber(msOrFnOrAlias)   then @_waitNumber.apply(@, args)
        when _.isFunction(msOrFnOrAlias) then @_waitFunction.apply(@, args)
        when _.isString(msOrFnOrAlias)   then @_waitString.apply(@, args)
        when _.isArray(msOrFnOrAlias)    then @_waitString.apply(@, args)
        else
          @throwErr "wait() must be invoked with either a number, a function, or an alias for a route!"

  Cypress.Cy.extend
    _waitNumber: (subject, ms, options) ->
      ## increase the timeout by the delta
      @_timeout(ms, true)

      if options.log isnt false
        options._log = Cypress.Log.command
          onConsole: -> {
            "Waited For": "#{ms}ms before continuing"
            "Returned": subject
          }

      Promise
        .delay(ms)
        .return(subject)

    _waitFunction: (subject, fn, options) ->
      @throwErr("cy.wait(fn) has been deprecated. Instead just change this command to be .should(fn).")

    _waitString: (subject, str, options) ->
      if options.log isnt false
        log = options._log = Cypress.Log.command
          type: "parent"
          aliasType: "route"

      getNumRequests = (alias) =>
        requests = @prop("aliasRequests") ? {}
        requests[alias] ?= 0
        requests[alias] += 1

        @prop("aliasRequests", requests)

        _.ordinalize requests[alias]

      checkForXhr = (alias, type, num, options) ->
        options.type = type

        ## append .type to the alias
        xhr = @getLastXhrByAlias(alias + "." + type)

        ## return our xhr object
        return Promise.resolve(xhr) if xhr

        options.error = "cy.wait() timed out waiting '#{options.timeout}ms' for the #{num} #{type} to the route: '#{alias}'. No #{type} ever occured."

        @_retry ->
          checkForXhr.call(@, alias, type, num, options)
        , options

      waitForXhr = (str, options) ->
        ## we always want to strip everything after the first '.'
        ## since we support alias property 'request'
        [str, str2] = str.split(".")

        if not aliasObj = @getAlias(str, log)
          @aliasNotFoundFor(str, log)

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
          @throwErr("cy.wait() can only accept aliases for routes.\nThe alias: '#{alias}' did not match a route.", options._log)

        ## create shallow copy of each options object
        ## but slice out the error since we may set
        ## the error related to a previous xhr
        timeout = options.timeout

        num = getNumRequests(alias)

        waitForRequest = =>
          options.timeout = timeout ? Cypress.config("requestTimeout")
          checkForXhr.call(@, alias, "request", num, options)

        waitForResponse = =>
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
          xhr = Promise.resolve waitForXhr.call(@, str, _.omit(options, "error", "timeout"))
          xhrs.push(xhr)
          xhr
        .then (responses) ->
          ## if we only asked to wait for one alias
          ## then return that, else return the array of xhr responses
          ret = if responses.length is 1 then responses[0] else responses

          if options._log
            options._log.set "onConsole", -> {
              "Waited For": @referencesAlias.join(", ")
              "Returned": ret
            }

            options._log.snapshot().end()

          return ret
        .catch (err) ->
          _(xhrs).invoke("cancel")
          throw err
