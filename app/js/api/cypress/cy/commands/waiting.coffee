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
        options.value = fn.call(@prop("runnable").ctx, subject)
        return subject if options.value
      catch e
        options.error = "Could not continue due to: " + e
        return @_retry(retry, options)

      ## retry outside of the try / catch block because
      ## if retry throws errors we want those to bubble
      options.error = "The final value was: " + options.value
      return @_retry(retry, options) if _.isNull(options.value) or options.value is false

  Cypress.addDualCommand

    ## break this up into private methods using Cypress.extend
    wait: (subject, msOrFnOrAlias, options = {}) ->
      msOrFnOrAlias ?= 1e9

      ## WHEN WE RETRY A WAIT, WE NEED TO IMMEDIATELY LOG
      ## OUT THE COMMAND SO USERS CAN SEE THAT WE'RE REATTEMPTING
      ## SOMETHING.
      ## WHEN ITS SUCCESSFUL THEN REMOVE THIS COMMAND
      ## WHEN IT ERRORS, YOU'LL STILL SEE IT
      ## ADDITIONALLY NEED TO LOG OUT WAIT FOR NUMBER ARGUMENTS

      options.log ?= (onConsole, alias, error) ->
        obj = {
          end: true
          snapshot: true
          referencesAlias: alias
          aliasType: "route"
          numRetries: options.retries
          onConsole: -> onConsole
        }

        obj.error = error if error

        Cypress.command(obj)

      args = [subject, msOrFnOrAlias, options]

      switch
        when _.isNumber(msOrFnOrAlias)   then @_waitNumber.apply(@, args)
        when _.isFunction(msOrFnOrAlias) then @_waitFunction.apply(@, args)
        when _.isString(msOrFnOrAlias)   then @_waitString.apply(@, args)
        else
          @throwErr "wait() must be invoked with either a number, a function, or an alias for a route!"

  Cypress.Cy.extend
    _waitNumber: (subject, ms, options) ->
      debugger
      ## increase the timeout by the delta
      @_timeout(ms, true)

      options.log({"Waited For": "#{ms}ms before continuing"})

      return Promise.delay(ms).return(subject)

    _waitFunction: (subject, fn, options) ->
      retry = ->
        @invoke2(@prop("current"), fn, options)

      stringify = (fn) ->
        _.str.clean fn.toString()

      try
        ## invoke fn and make sure its not strictly false
        options.value = fn.call(@prop("runnable").ctx, subject)
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
      if not alias = @getAlias(str)
        @aliasNotFoundFor(str)

      ## if this alias is for a route then poll
      ## until we find the response xhr object
      ## by its alias
      {alias, command} = alias

      if command.name isnt "route"
        @throwErr("cy.wait() can only accept aliases for routes.  The alias: '#{alias}' did not match a route.")

      xhr = @getResponseByAlias(alias)

      return xhr if xhr

      retry = ->
        options.onFail ?= (err) ->
          options.log({
            "Waited For": "alias: '#{alias}' to have a response"
            Alias: xhr
          }, alias, err)

        options.error ?= "cy.wait() timed out waiting for a response to the route: '#{alias}'. No response ever occured."

        @invoke2(@prop("current"), str, options)

      @_retry(retry, options)