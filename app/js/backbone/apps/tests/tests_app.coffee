@App.module "TestsApp", (TestsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestsApp

    before: ->
      App.vent.trigger "main:nav:choose", "Tests"

    actions:
      show: ->
        route: "tests/:id"

  router = new Router