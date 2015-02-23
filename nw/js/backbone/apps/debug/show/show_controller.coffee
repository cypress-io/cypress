@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      logs = App.request "log:entities"

      debugView = @getDebugView(logs)

      @listenTo debugView, "clear:clicked", ->
        logs.clear()

      @show debugView

    getDebugView: (logs) ->
      new Show.Debug
        collection: logs