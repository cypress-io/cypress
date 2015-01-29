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
      @project = @booter(path)

      @project.boot().get("settings")

    closeProject: ->
      @project.close().bind(@).then ->
        delete @project

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    config = new Entities.Config _(attrs).omit("cache", "booter")
    config.cache = attrs.cache
    config.booter = attrs.booter
    config