@App.module "TestJobsApp", (TestJobsApp, App, Backbone, Marionette, $, _) ->

  class Router extends App.Routers.Application
    module: TestJobsApp

    actions:
      list: ->

  router = new Router

  App.commands.setHandler "list:test:jobs", (region, runner, jobName) ->
    router.to "list", region: region, runner: runner, jobName: jobName