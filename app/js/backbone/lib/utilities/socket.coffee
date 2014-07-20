@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =

    start: ->
      socket = io.connect(location.host)

      socket.on "test:changed", (data) ->
        console.warn "test:changed", data

  App.commands.setHandler "socket:start", ->
    API.start()