@App.module "BuildsApp", (BuildsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: BuildsApp

    before: ->
      App.vent.trigger "main:nav:choose", "Builds"

    actions:
      list: ->
        route: "builds"

  router = new Router