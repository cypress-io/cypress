@App.module "LoginApp", (LoginApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: LoginApp

    actions:
      show: ->

  router = new Router

  App.vent.on "start:login:app", ->
    router.to "show"