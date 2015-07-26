@App.module "OrganizeApp", (OrganizeApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: OrganizeApp

    before: ->
      App.vent.trigger "main:nav:choose", "Tests"

    actions:
      list: ->
        route: "organize"

  router = new Router