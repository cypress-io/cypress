@App.module "TestInstruments", (TestInstruments, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestInstruments

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:instruments", (test, runner, region) ->
    router.to "list", test: test, runner: runner, region: region