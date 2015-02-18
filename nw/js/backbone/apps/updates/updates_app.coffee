@App.module "UpdatesApp", (UpdatesApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: UpdatesApp

    actions:
      show: ->

  router = new Router

  App.vent.on "start:updates:app", (region) ->
    router.to "show", region: region