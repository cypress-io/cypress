@App.module "SettingsApp", (SettingsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: SettingsApp

    before: ->
      App.vent.trigger "main:nav:choose", "Settings"

    actions:
      list: ->
        route: "settings"

  router = new Router