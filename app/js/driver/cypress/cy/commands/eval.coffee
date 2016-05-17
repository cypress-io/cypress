$Cypress.register "Eval", (Cypress, _, $, Promise) ->

  Cypress.on "abort", ->
    if @prop
      @prop("xhr")?.abort()

  Cypress.addParentCommand
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
          try
            response = JSON.parse(response)
          @_timeout(prevTimeout)

          return response