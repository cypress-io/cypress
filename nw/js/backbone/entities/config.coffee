@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      @get("env") is str

    getSessionId: ->
      @appInfo.getSessionId()

    setSessionId: (id) ->
      @appInfo.setSessionId(id)

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    appInfo = attrs.appInfo
    config = new Entities.Config _(attrs).omit("appInfo")
    config.appInfo = appInfo
    config