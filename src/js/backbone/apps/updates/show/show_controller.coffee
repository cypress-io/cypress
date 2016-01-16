@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      updater = App.updater

      updatesView = @getUpdatesView(updater)

      @listenTo updatesView, "button:clicked", ->
        window.close()

      @listenTo updatesView, "changelog:clicked", ->
        ## this needs to be moved to an .env variable
        App.execute "gui:external:open", "http://on.cypress.io/changelog"

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