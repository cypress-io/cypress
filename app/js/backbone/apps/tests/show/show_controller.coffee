@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      App.vent.trigger "test:opened"

      view = @getTestView()

      @show view

    onDestroy: ->
      App.vent.trigger "test:closed"

    getTestView: ->
      new Show.Test
