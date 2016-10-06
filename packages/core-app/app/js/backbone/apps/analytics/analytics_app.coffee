@App.module "AnalyticsApp", (AnalyticsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: AnalyticsApp

    before: ->
      App.vent.trigger "main:nav:choose", "Analytics"

    actions:
      list: ->
        route: "analytics"

  router = new Router