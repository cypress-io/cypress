@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      manifest = App.request "gui:manifest"

      updater = App.request "new:updater:entity", {version: manifest.version}
      updater.setUpdater App.config.getUpdater()

      updatesView = @getUpdatesView(updater)

      @listenTo updatesView, "show", ->
        ## add all of the
        updater.run
          onError: ->
          onDone: ->
          onAlways: ->
          onDownload: ->

      @show updatesView

    getUpdatesView: (updater) ->
      new Show.Updates
        model: updater