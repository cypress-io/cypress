@App.module "TestPanelsApp", (TestPanelsApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: TestPanelsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:panels", (region, runner) ->
    router.to "list", region: region, runner: runner
