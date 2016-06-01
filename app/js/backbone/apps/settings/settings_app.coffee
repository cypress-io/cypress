@App.module "SettingsApp", (SettingsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: SettingsApp

    actions:
      list: ->
        route: "settings"

  router = new Router