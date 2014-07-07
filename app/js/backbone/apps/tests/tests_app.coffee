@Ecl.module "TestsApp", (TestsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestsApp

    actions:
      list: ->
        route: "tests"

  router = new Router