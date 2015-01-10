do (Cypress, _) ->

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

      log = (onConsole, error) ->
        obj = {
          referencesAlias: alias
          aliasType: "route"
          numRetries: options.retries
          onConsole: -> onConsole
        }

        obj.error = error if error

        Cypress.command(obj)

      switch
        when _.isNumber(msOrFnOrAlias)
          ms = msOrFnOrAlias

          ## increase the timeout by the delta
          @_timeout(ms, true)

          log({"Waited For": "#{ms}ms before continuing"})

          return Promise.delay(ms).return(subject)

        when _.isFunction(msOrFnOrAlias)
          fn = msOrFnOrAlias

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
          return @_retry(retry, options) if _.isNull(options.value) or options.value is false

        when _.isString(msOrFnOrAlias)
          alias = @getAlias(msOrFnOrAlias)

          ## if this alias is for a route then poll
          ## until we find the response xhr object
          ## by its alias
          {alias, command} = alias

          @throwErr("cy.wait() can only accept aliases for routes.  The alias: '#{alias}' did not match a route.") if command.name isnt "route"

          if xhr = @getResponseByAlias(alias)
            return xhr
          else
            retry = ->
              options.onFail ?= (err) ->
                log({
                  "Waited For": "alias: '#{alias}' to have a response"
                  Alias: xhr
                }, err)

              options.error ?= "cy.wait() timed out waiting for a response to the route: '#{alias}'. No response ever occured."

              @invoke2(@prop("current"), msOrFnOrAlias, options)
            return @_retry(retry, options)

        else
          @throwErr "wait() must be invoked with either a number, a function, or an alias for a route!"