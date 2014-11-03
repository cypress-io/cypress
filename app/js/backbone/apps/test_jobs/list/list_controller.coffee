@App.module "TestJobsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner, jobName } = options

      jobs = App.request "new:job:entities"

      @listenTo runner, "sauce:job:start", (obj) ->
        jobs.add obj

      view = @getView(jobs, jobName)

      @show view

    getView: (jobs, jobName) ->
      new List.Jobs
        jobName: jobName
        collection: jobs