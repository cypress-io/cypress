@App.module "FilesOnboardingApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      config = App.request "app:config:entity"

      view = @getView(config)

      @show view

    getView: (config) ->
      new Show.Layout
        model: config