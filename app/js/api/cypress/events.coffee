## adds a custom lightweight event bus
## to the Cypress class
do (Cypress, _) ->

  _.extend Cypress,
    ## TODO: write tests for this
    off: (name, fn) ->
      ## nuke all events if we dont
      ## have a specific named event
      ## or we dont have _events
      if not (name and @_events)
        @_events = []
        return @

      splice = (index) =>
        @_events.splice(index, 1)

      functionsMatch = (fn1, fn2) ->
        fn1 is fn2 or ("" + fn1 is "" + fn2)

      ## loop in reverse since we are
      ## destructively modifying _events
      for event, index in @_events by -1
        if event.name is name
          if fn
            ## if we have a passed in fn argument
            ## make sure our event has the same fn
            splice(index) if functionsMatch(event.fn, fn)
          else
            ## else always splice it out since
            ## it matches the name
            splice(index)

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