@App.module "TestCommandsApp", (TestCommandsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestCommandsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:commands", (test, iframe, region) ->
    router.to "list", test: test, iframe: iframe, region: region