@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      updatesView = @getUpdatesView()

      @show updatesView

    getUpdatesView: ->
      new Show.Updates