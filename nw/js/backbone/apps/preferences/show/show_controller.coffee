@App.module "PreferencesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      preferencesView = @getPreferencesView()

      @show preferencesView

    getPreferencesView: ->
      new Show.Preferences
