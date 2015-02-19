@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      manifest = App.request "gui:manifest"

      updater = App.request "new:updater:entity", {version: manifest.version}
      updater.setUpdater App.config.getUpdater()

      updatesView = @getUpdatesView(updater)

      set = (state) ->
        updater.setState(state)

      @listenTo updatesView, "show", ->
        ## add all of the
        updater.run
          onStart: -> set("checking")
          onApply: -> set("applying")
          onError: -> set("error")
          onDone: ->  set("done")
          onNone: ->  set("none")
          onDownload: (version) ->
            updater.setNewVersion(version)
            set("downloading")

      @show updatesView

    getUpdatesView: (updater) ->
      new Show.Updates
        model: updater