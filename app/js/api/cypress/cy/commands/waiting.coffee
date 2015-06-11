$Cypress.register "Waiting", (Cypress, _, $) ->

  Cypress.addChildCommand

    until: (subject, fn, options = {}) ->
      retry = ->
        ## should check here to make sure we have a .prev
        ## and if not we should throwErr
        @invoke2(@prop("current").prev).then =>
          @invoke2(@prop("current"), fn, options)

      try
        ## invoke fn and make sure its not strictly false
        options.value = fn.call(@private("runnable").ctx, subject)
        return subject if options.value
      catch e
        options.error = "Could not continue due to: " + e
        return @_retry(retry, options)

      ## retry outside of the try / catch block because
      ## if retry throws errors we want those to bubble
      options.error = "The final value was: " + options.value
      return @_retry(retry, options) if _.isNull(options.value) or options.value is false

  Cypress.addDualCommand

    wait: (subject, msOrFnOrAlias, options = {}) ->
      msOrFnOrAlias ?= 1e9

      ## check to ensure options is an object
      ## if its a string the user most likely is trying
      ## to wait on multiple aliases and forget to make this
      ## an array
      if _.isString(options)
        @throwErr("cy.wait() was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array.")

      _.defaults options,
        log: true

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

      if options.log
        command = Cypress.command
          onConsole: -> {
            "Waited For": "#{ms}ms before continuing"
            "Returned": subject
          }

      Promise
        .delay(ms)
        .then ->
          if command
            command.snapshot().end()

        .return(subject)

    _waitFunction: (subject, fn, options) ->
      retry = ->
        @invoke2(@prop("current"), fn, options)

      stringify = (fn) ->
        _.str.clean fn.toString()

      try
        ## invoke fn and make sure its not strictly false
        options.value = fn.call(@private("runnable").ctx, subject)
        if options.value
          ## do not think we need to log out waits
          ## just like we dont log out cy.thens
          ## if wait blows up and fails then handle that
          ## at that time
          # log({
          #   "Waited For": stringify(fn)
          #   Retried: options.retries + " times"
          # })
          return subject
      catch e
        options.error = "Could not continue due to: " + e

        return @_retry(retry, options)

      ## retry outside of the try / catch block because
      ## if retry throws errors we want those to bubble
      options.error = "The final value was: " + options.value

      @_retry(retry, options) if _.isNull(options.value) or options.value is false

    _waitString: (subject, str, options) ->
      if options.log
        options.command = Cypress.command
          type: "parent"
          aliasType: "route"

      getNumRequests = (alias) =>
        requests = @prop("aliasRequests") ? {}
        requests[alias] ?= 0
        requests[alias] += 1

        @prop("aliasRequests", requests)

        _.ordinalize requests[alias]

      checkForXhr = (alias, str, options) ->
        xhr = @getLastXhrByAlias(alias)

        word = @getXhrTypeByAlias(alias)

        ## return our xhr object
        return xhr if xhr

        options.error ?= "cy.wait() timed out waiting for the #{getNumRequests(alias)} #{word} to the route: '#{str}'. No #{word} ever occured."

        ## store the current runnable timeout here
        ## and manage it ourselves
        options.runnableTimeout ?= @_timeout()

        ## prevent the runnable from timing out entirely
        @_clearTimeout()

        @_retry ->
          checkForXhr.call(@, alias, str, options)
        , options

      waitForXhr = (str) ->
        ## we always want to strip everything after the first '.'
        ## since we support alias property 'request'
        [str, str2] = str.split(".")

        if not aliasObj = @getAlias(str)
          return @aliasNotFoundFor(str)

        ## if this alias is for a route then poll
        ## until we find the response xhr object
        ## by its alias
        {alias, command} = aliasObj

        str = _.compact([alias, str2]).join(".")

        ## if we have a command then continue to
        ## build up an array of referencesAlias
        ## because wait can reference an array of aliases
        if options.command
          referencesAlias = options.command.get("referencesAlias") ? []
          aliases = [].concat(referencesAlias)
          aliases.push(str)
          options.command.set "referencesAlias", aliases

        if command.name isnt "route"
          @throwErr("cy.wait() can only accept aliases for routes.  The alias: '#{alias}' did not match a route.", options.command)

        ## create shallow copy of each options object
        checkForXhr.call(@, str, alias, _.clone(options))

      ## we have to juggle a separate array of promises
      ## in order to cancel them when one bombs
      ## so they dont just keep retrying and retrying
      xhrs = []

      Promise
        .map [].concat(str), (str) =>
          ## we may get back an xhr value instead
          ## of a promise, so we have to wrap this
          ## in another promise :-(
          xhr = Promise.resolve waitForXhr.call(@, str)
          xhrs.push(xhr)
          xhr
        .then (responses) ->
          ## if we only asked to wait for one alias
          ## then return that, else return the array of xhr responses
          ret = if responses.length is 1 then responses[0] else responses

          if options.command
            options.command.set "onConsole", -> {
              "Waited For": @referencesAlias.join(", ")
              "Returned": ret
            }

            options.command.snapshot().end()

          return ret
        .catch (err) ->
          _(xhrs).invoke("cancel")
          throw err
