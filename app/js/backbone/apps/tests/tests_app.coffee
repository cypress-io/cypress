@App.module "TestsApp", (TestsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestsApp

    actions:
      list: ->
        route: "tests"

      show: ->
        route: "tests/*id"

  router = new Router

  App.reqres.setHandler "show:test", (id) ->
    router.to "show", id: id

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
