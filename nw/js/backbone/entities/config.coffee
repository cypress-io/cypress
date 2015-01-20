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

    addProject: (path) ->
      @appInfo.addProject(path)

    getProjectPaths: ->
      @appInfo.getProjectPaths()

    runProject: (path) ->
      @Server(projectRoot: path)
      @Server.open()

    closeProject: ->
      @Server.close()

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    appInfo = attrs.appInfo
    Server = attrs.Server
    config = new Entities.Config _(attrs).omit("appInfo", "Server")
    config.appInfo = appInfo
    config.Server = Server
    config