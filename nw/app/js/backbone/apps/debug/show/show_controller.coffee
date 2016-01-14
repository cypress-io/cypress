@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      @logs = logs = App.request "log:entities"

      debugView = @getDebugView(logs)

      @listenTo debugView, "clear:clicked", ->
        logs.clear()

      @listenTo debugView, "refresh:clicked", ->
        logs.refresh()

      @show debugView

    onDestroy: ->
      @logs.offLog()

    getDebugView: (logs) ->
      new Show.Debug
        collection: logs