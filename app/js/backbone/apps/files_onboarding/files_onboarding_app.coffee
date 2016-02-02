@App.module "FilesOnboardingApp", (FilesOnboardingApp, App, Backbone, Marionette, $, _) ->
  @startWithParent = false

  class Router extends App.Routers.Application
    module: FilesOnboardingApp

    actions:
      show: ->
        defaultParams: ->
          region: App.dialogRegion

  router = new Router

  App.commands.setHandler "show:files:onboarding", ->
    router.to "show", {}