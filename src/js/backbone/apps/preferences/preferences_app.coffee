@App.module "PreferencesApp", (PreferencesApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: PreferencesApp

    actions:
      show: ->

  router = new Router

  App.vent.on "start:preferences:app", (region, win) ->
    router.to "show", region: region, window: win