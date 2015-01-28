@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      env = @get("env")
      switch
        when _.isString(str) then env is str
        else env

    getSessionId: ->
      @cache.getSessionId()

    setSessionId: (id) ->
      @cache.setSessionId(id)

    addProject: (path) ->
      @cache.addProject(path)

    getProjectPaths: ->
      @cache.getProjectPaths()

    runProject: (path) ->
      @Server(projectRoot: path)
      @Server.open()

    closeProject: ->
      @Server.close()

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    cache = attrs.cache
    Server = attrs.Server
    config = new Entities.Config _(attrs).omit("cache", "Server")
    config.cache = cache
    config.Server = Server
    config