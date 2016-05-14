@App.module "AutomationApp", (AutomationApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: AutomationApp

    actions:
      show: ->

  router = new Router

  App.commands.setHandler "show:automation", ->
    router.to "show"