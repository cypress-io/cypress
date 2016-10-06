@App.module "TestStatsApp", (TestStatsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestStatsApp

    actions:
      show: ->

  router = new Router

  App.commands.setHandler "show:test:stats", (region, runner) ->
    router.to "show", region: region, runner: runner