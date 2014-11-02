@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Socket extends Entities.Model
    setChannel: (@channel) ->

    emit: (event, data...) ->
      @channel.emit event, data...

  App.reqres.setHandler "io:entity", (channel) ->
    socket = new Entities.Socket
    socket.setChannel channel
    socket
