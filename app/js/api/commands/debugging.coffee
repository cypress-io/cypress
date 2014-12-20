do (Cypress, _) ->

  Cypress.add
    inspect: ->
      ## bug fix due to 3rd party libs like
      ## chai using inspect function for
      ## special display
      # return "" if not @prop

      @prop("inspect", true)

    debug: ->
      console.log "\n%c------------------------Cypress Command Info------------------------", "font-weight: bold;"
      _.each ["options", "subject", "runnable", "queue", "index"], (item) =>
        console.log "#{item}: ", (@prop(item) or @[item])
      debugger