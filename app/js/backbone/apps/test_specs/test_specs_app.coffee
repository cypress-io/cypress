@App.module "TestSpecsApp", (TestSpecsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestSpecsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:specs", (region, reporter, spec) ->
    router.to "list", region: region, reporter: reporter, spec: spec