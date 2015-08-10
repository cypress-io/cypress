@App.module "TestsApp", (TestsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestsApp

    before: (params = {}) ->
      @checkNav(params)
      @updateAppEnv(params)

      App.vent.trigger "main:nav:choose", "Tests"

    checkNav: (params) ->
      ## quick hack to get rid of the left nav
      ## used for sauce labs automated tests
      if params.nav and params.nav is "false"
        App.config.trigger "remove:nav"

    updateAppEnv: (params) ->
      if ui = params.__ui
        App.config.setUI(ui)

    actions:
      show: ->
        route: "tests/*id"

  router = new Router

  App.commands.setHandler "switch:to:manual:browser", (id, browser, version) ->
    obj = {id: id}

    ## if browser and version are set
    ## then extend the obj, else dont
    if browser and version
      _.extend obj,
        browser: browser
        version: version
        __ui:   "host"

    router.to "show", obj
