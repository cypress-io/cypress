@App.module "TestJobsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner, jobName } = options

      view = @getView(jobName)

      @show view

    getView: (jobName) ->
      new List.Jobs
        jobName: jobName