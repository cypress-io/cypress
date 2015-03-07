@App.module "TestAgentsApp", (TestAgentsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestAgentsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:agents", (test, runner, region) ->
    router.to "list", test: test, runner: runner, region: region