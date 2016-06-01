@App.module "TestIframeApp", (TestIframeApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestIframeApp

    actions:
      show: ->

  router = new Router

  App.commands.setHandler "show:test:iframe", (region, iframe) ->
    router.to "show", region: region, iframe: iframe