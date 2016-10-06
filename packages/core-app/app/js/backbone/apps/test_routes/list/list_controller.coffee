@App.module "TestRoutesApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { test } = options

      @routes = routes = test.get("routes")

      routesView = @getRoutesView routes

      @show routesView

    onDestroy: ->
      @routes.reset([], {silent: true})

    getRoutesView: (routes) ->
      new List.Routes
        collection: routes
