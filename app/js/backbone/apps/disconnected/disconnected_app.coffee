@App.module "DisconnectedApp", (DisconnectedApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: DisconnectedApp

    actions:
      show: ->

  router = new Router

  App.commands.setHandler "show:disconnected", ->
    router.to "show"