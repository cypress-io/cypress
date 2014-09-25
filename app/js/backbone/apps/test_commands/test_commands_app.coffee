@App.module "TestCommandsApp", (TestCommandsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestCommandsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:commands", (hooks, runner, region) ->
    router.to "list", hooks: hooks, runner: runner, region: region