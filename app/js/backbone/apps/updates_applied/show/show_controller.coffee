@App.module "UpdatesAppliedApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application
    initialize: (options) ->
      updatesView = @getUpdatesView()

      @show updatesView

    getUpdatesView: ->
      new Show.UpdatesApplied