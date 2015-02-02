@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.User extends Entities.Model
    defaults: ->
      loggingIn: false

    loggingIn: ->
      @set "loggingIn", true

    loggedIn: (attrs) ->
      @set "loggingIn", false
      @set attrs

  App.reqres.setHandler "new:user:entity", (attrs = {}) ->
    new Entities.User attrs