@App.module "AboutApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      updater = App.updater

      App.ipc("get:about:logo:src").then (src) =>

        aboutView = @getAboutView(updater, src)

        @listenTo aboutView, "page:clicked", ->
          ## this needs to be moved to an .env variable
          App.ipc("external:open", "https://cypress.io")

        @show aboutView

    getAboutView: (updater, src) ->
      new Show.About
        model: updater
        src: src