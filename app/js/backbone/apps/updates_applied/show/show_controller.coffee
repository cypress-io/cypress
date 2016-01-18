@App.module "UpdatesAppliedApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application
    initialize: (options) ->
      {appPath, execPath} = options

      updatesView = @getUpdatesView()

      @listenTo updatesView, "show", ->
        App.updater.install(appPath, execPath)

      @show updatesView

    getUpdatesView: ->
      new Show.UpdatesApplied