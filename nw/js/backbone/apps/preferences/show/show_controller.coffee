@App.module "PreferencesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options = {}) ->
      { window } = options

      user        = App.request("current:user")
      preferences = App.request("new:preferences:entity")

      setToken = (token) ->
        preferences.setToken(token)

      setError = (err) ->
        preferences.setError()

      App.config.getToken(user)
        .then(setToken)
        .catch(setError)

      preferencesView = @getPreferencesView(preferences)

      @listenTo preferencesView, "generate:clicked", ->
        ## bail if we're currently generating a token
        return if preferences.isGeneratingToken()

        preferences.unset("error")

        ## we have begun generating a new token
        preferences.generateToken()

        ## generate a new token here
        App.config.generateToken(user)
          .then(setToken)
          .catch(setError)

      @show preferencesView

    getPreferencesView: (preferences) ->
      new Show.Preferences
        model: preferences
