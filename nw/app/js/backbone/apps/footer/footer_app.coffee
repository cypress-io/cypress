@App.module "FooterApp", (FooterApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: FooterApp

    actions:
      show: ->
        defaultParams: ->
          region: App.footerRegion

  router = new Router

  App.vent.on "start:footer:app", ->
    router.to "show"