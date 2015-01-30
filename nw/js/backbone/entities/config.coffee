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

    logIn: (url) ->
      @request.post(url).then (res, err) ->
        debugger
      .catch ->
        debugger
      # App.config.setSessionId("foobarbaz123").then ->


  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    props = ["cache", "booter", "request"]

    config = new Entities.Config _(attrs).omit props...

    _.each props, (prop) ->
      config[prop] = attrs[prop]

    config