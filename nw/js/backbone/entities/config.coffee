@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      env = @get("env")
      switch
        when _.isString(str) then env is str
        else env

    getUser: ->
      @cache.getUser()

    setUser: (user) ->
      @cache.setUser(user)

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

    logIn: (code) ->
      @cache.logIn(code).bind(@)
      .then (user) ->
        @setUser(user)
        .return(user)

    logOut: (user) ->
      @cache.logOut(user.get("session_token"))

    log: (text, data = {}) ->
      data.type = "native"
      @getLog().log("info", text, data)

    getLog: ->
      @Log ? throw new Error("config#Log is not defined!")

    getLogs: ->
      @getLog().getLogs()

    onLog: (fn) ->
      @getLog().onLog(fn)

    clearLogs: ->
      @getLog().clearLogs()

    offLog: ->
      @getLog().off()

    getUpdater: -> @updater

    setErrorHandler: ->
      @getLog().setErrorHandler (err) =>
        ## exit if we're in production (blow up)
        return true if @env("production")

        ## else log out the err stack
        console.error(err)

        ## and go into debug mode if we should
        debugger if @get("debug")

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    props = ["cache", "booter", "updater", "Log"]

    config = new Entities.Config _(attrs).omit props...

    _.each props, (prop) ->
      config[prop] = attrs[prop]

    config.setErrorHandler()

    config