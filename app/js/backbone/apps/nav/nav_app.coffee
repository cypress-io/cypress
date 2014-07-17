@App.module "NavApp", (NavApp, App, Backbone, Marionette, $, _) ->
  @startWithParent = false

  class Router extends App.Routers.Application
    module: NavApp

    actions:
      list: ->
        defaultParams:
          region: App.navRegion

  router = new Router

  NavApp.on "start", ->
    router.to "list"