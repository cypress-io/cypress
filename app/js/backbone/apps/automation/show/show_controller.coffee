@App.module "AutomationApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      socket = App.request "socket:entity"

      view = @getView()

      @listenTo view, "reload:button:clicked", ->
        ## fire the event so this browser process
        ## can be terminated and a new one can be opened
        ## at the exact same url as we're at now
        socket.emit "reload:browser", window.location.toString()

      @show view

    getView: ->
      new Show.Layout