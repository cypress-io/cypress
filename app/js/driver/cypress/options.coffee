do ($Cypress, _) ->

  $Cypress.extend
    ## TODO
    ## write tests for the options interface
    ## including resetting these in between test runs
    options: (obj) ->
      @_options ?= {}

      _.extend @_options, obj

    option: (key, val) ->
      @_options ?= {}

      if not val
        # _.result(@_options, key)
        @_options[key]
      else
        @_options[key] = val