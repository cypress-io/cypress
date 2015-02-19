@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      manifest = App.request "gui:manifest"

      updater = App.request "new:updater:entity", {version: manifest.version}
      updater.setUpdater App.config.getUpdater()

      updatesView = @getUpdatesView(updater)

      set = (state) ->
        debugger
        updater.setState(state)

      @listenTo updatesView, "show", ->
        ## add all of the
        updater.run
          onStart: ->    set("checking")
          onDownload: -> set("downloading")
          onApply: ->    set("applying")
          onDone: ->     set("done")
          onNone: ->     set("none")
          onError: ->    set("error")
          # onAlways: ->

      @show updatesView

    getUpdatesView: (updater) ->
      new Show.Updates
        model: updater