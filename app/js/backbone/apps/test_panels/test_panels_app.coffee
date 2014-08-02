@App.module "TestPanelsApp", (TestPanelsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestPanelsApp

    actions:
      list: ->

      dom: ->
        controller: "DOM"

      xhr: ->
        controller: "XHR"

      log: ->
        controller: "LOG"

  router = new Router

  App.commands.setHandler "list:test:panels", (region, runner, regions) ->
    router.to "list", region: region, runner: runner, regions: regions

  App.commands.setHandler "show:panel", (panel, region) ->
    router.to panel.get("name").toLowerCase(), region: region, panel: panel