@App.module "TestAgentsApp", (TestAgentsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestAgentsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:agents", (test, region) ->
    router.to "list", test: test, region: region