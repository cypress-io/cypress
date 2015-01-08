@App.module "TestRoutesApp", (TestRoutesApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestRoutesApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:routes", (test, runner, region) ->
    router.to "list", test: test, runner: runner, region: region