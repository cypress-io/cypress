do (Cypress, _) ->

  Cypress.addUtility

    until: (fn, options = {}) ->
      retry = ->
        ## should check here to make sure we have a .prev
        ## and if not we should throwErr
        @invoke2(@prop("current").prev).then =>
          @invoke2(@prop("current"), fn, options)

      try
        ## invoke fn and make sure its not strictly false
        options.value = fn.call(@prop("runnable").ctx, @prop("subject"))
        return @prop("subject") if options.value
      catch e
        options.error = "Could not continue due to: " + e
        return @_retry(retry, options)

      ## retry outside of the try / catch block because
      ## if retry throws errors we want those to bubble
      options.error = "The final value was: " + options.value
      return @_retry(retry, options) if _.isNull(options.value) or options.value is false

    wait: (msOrFn, options = {}) ->
      msOrFn ?= 1e9

      switch
        when _.isNumber(msOrFn)
          ## increase the timeout by the delta
          @_timeout(msOrFn, true)
          return Promise.delay(msOrFn)

        when _.isFunction(msOrFn)
          fn = msOrFn

          retry = ->
            @invoke2(@prop("current"), fn, options)

          try
            ## invoke fn and make sure its not strictly false
            options.value = fn.call(@prop("runnable").ctx, @prop("subject"))
            return @prop("subject") if options.value
          catch e
            options.error = "Could not continue due to: " + e
            return @_retry(retry, options)

          ## retry outside of the try / catch block because
          ## if retry throws errors we want those to bubble
          options.error = "The final value was: " + options.value
          return @_retry(retry, options) if _.isNull(options.value) or options.value is false

        else
          @throwErr "wait() must be invoked with either a number or a function!"
