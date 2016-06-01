@App.module "BuildsApp", (BuildsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: BuildsApp

    actions:
      list: ->
        route: "builds"

      show: ->
        route: "build"


  router = new Router

  App.vent.on "show:build", (build) ->
    router.to "show", build: build