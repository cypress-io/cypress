@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      env = @get("env")
      switch
        when _.isString(str) then env is str
        else env

    getSessionId: ->
      @appInfo.getSessionId()

    setSessionId: (id) ->
      @appInfo.setSessionId(id)

    addProject: ->

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    appInfo = attrs.appInfo
    config = new Entities.Config _(attrs).omit("appInfo")
    config.appInfo = appInfo
    config