@App.module "FilesOnboardingApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      view = @getView()

      @show view

    getView: ->
      new Show.Layout