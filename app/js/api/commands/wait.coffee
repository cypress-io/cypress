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

    wait: (subject, msOrFnOrAlias, options = {}) ->
      msOrFnOrAlias ?= 1e9

      switch
        when _.isNumber(msOrFnOrAlias)
          ms = msOrFnOrAlias

          ## increase the timeout by the delta
          @_timeout(ms, true)
          return Promise.delay(ms)

        when _.isFunction(msOrFnOrAlias)
          fn = msOrFnOrAlias

          retry = ->
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

        when _.isString(msOrFnOrAlias)
          alias = @getAlias(msOrFnOrAlias)

          ## if this alias is for a route then poll
          ## until we find the response xhr object
          ## by its alias
          {alias, command} = alias
          if command.name is "route"
            if xhr = @getResponseByAlias(alias)
              return xhr
            else
              retry = ->
                @invoke2(@prop("current"), alias, options)
              @_retry(retry, options)

        else
          @throwErr "wait() must be invoked with either a number, a function, or an alias for a route!"
