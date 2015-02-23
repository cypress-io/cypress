@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      debugView = @getDebugView()

      @show debugView

    getDebugView: ->
      new Show.Debug