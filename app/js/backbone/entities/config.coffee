@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      env = @get("env")
      switch
        when _.isString(str) then env is str
        else env

    log: (text, data = {}) ->
      data.type = "native"
      @getLog().log("info", text, data)

    getToken: (user) ->
      @getCache().getToken(user.get("session_token"))

    generateToken: (user) ->
      @getCache().generateToken(user.get("session_token"))

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    new Entities.Config attrs