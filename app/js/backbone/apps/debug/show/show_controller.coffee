@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      logs = App.request "log:entities"

      App.ipc "on:log", (log) ->
        logs.add(log)

      debugView = @getDebugView(logs)

      @listenTo debugView, "clear:clicked", ->
        App.ipc("clear:logs").then ->
          logs.reset()

      @listenTo debugView, "refresh:clicked", ->
        logs.refresh()

      @show debugView

    onDestroy: ->
      App.ipc("off:log")

    getDebugView: (logs) ->
      new Show.Debug
        collection: logs