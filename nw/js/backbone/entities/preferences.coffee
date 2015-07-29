@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Preferences extends Entities.Model
    defaults: ->
      token: null
      error: false
      runOnStartup: false
      generatingToken: false

    setToken: (token) ->
      @set "token", token

    generateToken: ->
      @set "generatingToken", true

    isGeneratingToken: ->
      @get "generatingToken"

    setError: ->
      @set "error", true

  App.reqres.setHandler "new:preferences:entity", (attrs = {}) ->
    new Entities.Preferences attrs
