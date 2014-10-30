@App.module "TestsApp", (TestsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestsApp

    before: (params = {}) ->
      @updateAppEnv(params)

      App.vent.trigger "main:nav:choose", "Tests"

    updateAppEnv: (params) ->
      ## store whether this was existing
      existing = !!params.__env

      ## always set the __env on our params
      ## this allows the user to change the URL
      ## to switch our __env mode
      ## or if unchanged will just match our current environment
      params.__env ?= App.getCurrentEnvironment()

      ## always attempt to reset the env as well
      ## which will fire change events if necessary
      App.config.setEnv(params.__env)

      ## clear out the env from params
      ## if it didnt exist before so its not
      ## displayed in our URL
      delete params.__env if not existing

    actions:
      show: ->
        route: "tests/*id"

  router = new Router
