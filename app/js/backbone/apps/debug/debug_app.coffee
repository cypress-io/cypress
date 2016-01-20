@App.module "DebugApp", (DebugApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: DebugApp

    actions:
      show: ->

  router = new Router

  App.vent.on "start:debug:app", (region) ->
    router.to "show", region: region