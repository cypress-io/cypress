@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      env = @get("env")
      switch
        when _.isString(str) then env is str
        else env

    _getProp: (prop) ->
      @backend[prop] ? throw new Error("config#backend.#{prop} is not defined!")

    getCache: -> @_getProp("cache")

    getBooter: -> @_getProp("Booter")

    getManifest: -> @_getProp("manifest")

    getUpdater: -> @_getProp("updater")

    getLog: -> @_getProp("Log")

    getChromium: -> @_getProp("Chromium")

    getUser: ->
      @getCache().getUser()

    setUser: (user) ->
      @getCache().setUser(user)

    addProject: (path) ->
      @getCache().addProject(path)

    removeProject: (path) ->
      @getCache().removeProject(path)

    getProjectPaths: ->
      @getCache().getProjectPaths()

    runProject: (path, options = {}) ->
      @project = @getBooter()(path)

      @project.boot(options).get("settings")

    closeProject: ->
      @project.close().bind(@).then ->
        delete @project

    logIn: (code) ->
      @getCache().logIn(code).bind(@)
      .then (user) ->
        @setUser(user)
        .return(user)

    logOut: (user) ->
      @getCache().logOut(user.get("session_token"))

    log: (text, data = {}) ->
      data.type = "native"
      @getLog().log("info", text, data)

    getLogs: ->
      @getLog().getLogs()

    onLog: (fn) ->
      @getLog().onLog(fn)

    clearLogs: ->
      @getLog().clearLogs()

    offLog: ->
      @getLog().off()

    chromium: (window, options) ->
      C = @getChromium()

      C(window).override(options)

    getManifest: -> @getManifest()

    getToken: (user) ->
      @getCache().getToken(user.get("session_token"))

    generateToken: (user) ->
      @getCache().generateToken(user.get("session_token"))

    setErrorHandler: ->
      @getLog().setErrorHandler (err) =>
        ## exit if we're in production (blow up)
        return true if @env("production")

        ## else log out the err stack
        console.error(err)

        ## and go into debug mode if we should
        debugger if @get("debug")

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    props = ["backend"]

    config = new Entities.Config _(attrs).omit props...

    _.each props, (prop) ->
      config[prop] = attrs[prop]

    config.setErrorHandler()

    config