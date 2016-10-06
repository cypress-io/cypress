@App.module "FilesOnboardingApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      socket = App.request "socket:entity"
      config = App.request "app:config:entity"

      view = @getView(config)

      @listenTo view, "cypress:folder:clicked", ->
        socket.emit("open:finder", config.get("parentTestsFolder"))

      @listenTo view, "example:file:clicked", ->
        socket.emit("open:finder", config.get("integrationExampleFile"))

      @listenTo view, "fixtures:folder:clicked", ->
        socket.emit("open:finder", config.get("fixturesFolder"))

      @listenTo view, "support:folder:clicked", ->
        socket.emit("open:finder", config.get("supportFolder"))

      @show view

    getView: (config) ->
      new Show.Layout
        model: config