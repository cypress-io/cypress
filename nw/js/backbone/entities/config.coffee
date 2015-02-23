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
      .catch (err) ->
        ## ...could not log in...
        debugger
        console.log("Error logging in!")
        throw err

    logOut: (user) ->
      @cache.logOut(user.get("session_token"))
      .catch (err) ->
        debugger
        console.log("Error logging out!")
        throw err

    log: (text, data = {}) ->
      data.code = "native"
      @getLog().log("info", text, data)

    getLog: ->
      @Log ? throw new Error("config#Log is not defined!")

    getUpdater: -> @updater

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    props = ["cache", "booter", "updater", "Log"]

    config = new Entities.Config _(attrs).omit props...

    _.each props, (prop) ->
      config[prop] = attrs[prop]

    config