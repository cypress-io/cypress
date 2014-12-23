do (Cypress, _) ->

  Cypress.addParent

    eval: (code, options = {}) ->
      _.defaults options,
        timeout: 15000

      ## obviously this needs to be moved to a separate method
      prevTimeout = @_timeout()
      @_timeout(options.timeout)

      ## this should probably become a queue of xhr's which we abort
      ## iterative during Cypress.abort()
      ## and we splice ourselves out of the xhr array on success
      xhr = @prop "xhr", $.getJSON("/eval", {code: code})
      Promise.resolve(xhr)
        .then (response) =>
          @_timeout(prevTimeout)
          return response