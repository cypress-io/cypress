@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      updater = App.updater

      updatesView = @getUpdatesView(updater)

      # @listenTo updatesView, "button:clicked", ->
        # window.close()

      @listenTo updatesView, "changelog:clicked", ->
        ## this needs to be moved to an .env variable
        App.ipc("external:open", "https://on.cypress.io/changelog")

      set = (state) ->
        updater.setState(state)

      @listenTo updatesView, "show", ->
        App.ipc "updater:run", (err, data = {}) ->
          switch data.event
            when "start" then set("checking")
            when "apply" then set("applying")
            when "error" then set("error")
            when "done"  then set("done")
            when "none"  then set("none")
            when "download"
              updater.setNewVersion(data.version)
              set("downloading")

      @show updatesView

    getUpdatesView: (updater) ->
      new Show.Updates
        model: updater