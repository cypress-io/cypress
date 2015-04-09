## adds a custom lightweight event bus
## to the Cypress class
do ($Cypress, _) ->

  splice = (index) ->
    @_events.splice(index, 1)

  $Cypress.extend
    event: (name) ->
      return if not @_events

      _.pluck @_events[name], "callback"

    invoke: (name, args...) ->
      return if not events = @event(name)

      _.map events, (event) =>
        event.apply(@cy, args)

    ## coerce the context of trigger'd events
    ## to ALWAYS be @cy
    trigger: (name) ->
      return if not events = @_events and @_events[name]

      for event in events
        event.ctx = @cy

      Backbone.Events.trigger.apply(@, arguments)