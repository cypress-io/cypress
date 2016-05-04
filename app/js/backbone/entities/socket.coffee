@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do (Promise) ->

    class Entities.Socket extends Entities.Model
      defaults: {
        automationConnected: null
      }

      initialize: ->
        @automationPromise = Promise.defer()

      setChannel: (@channel) ->

      emit: (event, data...) ->
        @channel.emit event, data...

      onAutomationDisconnected: ->
        @set "automationConnected", false

      automationConnected: (bool) ->
        @automationPromise.resolve(bool)
        @set("automationConnected", bool)

      whenAutomationKnown: (fn) ->
        @automationPromise.promise.then(fn)

    App.reqres.setHandler "io:entity", (channel, socketId) ->
      socket = new Entities.Socket socketId
      socket.setChannel channel
      socket
