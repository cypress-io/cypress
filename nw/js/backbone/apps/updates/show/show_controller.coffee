@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      updater = App.request "new:updater:entity"

      updatesView = @getUpdatesView(updater)

      @listenTo updatesView, "button:clicked", ->
        window.close()

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