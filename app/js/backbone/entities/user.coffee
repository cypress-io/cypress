@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.User extends Entities.Model
    defaults: ->
      loggingIn: false

    mutators:
      greeting: ->
        @attributes.name or @attributes.email

    loggingIn: ->
      @set "loggingIn", true

    loggedIn: (attrs) ->
      # @set "loggingIn", false
      @set attrs

    setLoginError: (err) ->
      @set "loggingIn", false, {silent: true}
      @set "error", err.message

  App.reqres.setHandler "new:user:entity", (attrs = {}) ->
    new Entities.User attrs