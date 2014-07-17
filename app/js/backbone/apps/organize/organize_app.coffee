@Ecl.module "OrganizeApp", (OrganizeApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: OrganizeApp

    actions:
      list: ->
        route: "organize"

  router = new Router