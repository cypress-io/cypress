## adds a custom lightweight event bus
## to the Cypress class
do ($Cypress, _) ->

  splice = (index) ->
    @_events.splice(index, 1)

  $Cypress.extend
    event: (name) ->
      return if not @_events

      _.chain(@_events)
        .where({name: name})
          .pluck("fn")
            .value()

    invoke: (name, args...) ->
      return if not events = @event(name)

      _.map events, (event) =>
        event.apply(@cy, args)

    ## TODO: write tests for this
    off: (name, fn) ->
      ## nuke all events if we dont
      ## have a specific named event
      ## or we dont have _events
      if not (name and @_events)
        @_events = []
        return @

      functionsMatch = (fn1, fn2) ->
        fn1 is fn2

      ## loop in reverse since we are
      ## destructively modifying _events
      for event, index in @_events by -1
        if event.name is name
          if fn
            ## if we have a passed in fn argument
            ## make sure our event has the same fn
            splice.call(@, index) if functionsMatch(event.fn, fn)
          else
            ## else always splice it out since
            ## it matches the name
            splice.call(@, index)

      return @

    on: (event, fn) ->
      return if not _.isFunction(fn)

      @_events ?= []

      @off(event, fn)
      @_events.push {name: event, fn: fn}

      return @

    trigger: (event, args...) ->
      return if not @_events

      _.chain(@_events)
        .where({name: event})
          .each (event) =>
            event.fn.apply(@cy, args)

      return @