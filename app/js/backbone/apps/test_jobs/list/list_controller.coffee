@App.module "TestJobsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner, jobName, batchId } = options

      jobs = App.request "new:job:entities"

      @listenTo runner, "sauce:job:create", (obj) ->
        ## make sure we're still on the same batchId
        ## this prevents picking up other sauce jobs
        ## which are unrelated to our batch
        return if obj.batchId isnt batchId

        jobs.add obj

      @listenTo runner, "sauce:job:start", (guid, id) ->
        ## when the sauce job starts we actually get
        ## its real session id, so lets find our job
        ## by its guid and give it a real id
        jobs.startJobByGuid(guid, id)

      @listenTo runner, "sauce:job:done", (id, runningTime, results = {}) ->
        ## this tells us when our job is done
        ## TODO figure out whether this test passed or failed
        jobs.done(id, runningTime, results)

      @listenTo runner, "sauce:job:fail", (id, err) ->
        ## if there was a literal error going out
        ## to sauce labs then our job failed
        jobs.fail(id, err)

      view = @getView(jobs, jobName)

      @show view

    getView: (jobs, jobName) ->
      new List.Jobs
        jobName: jobName
        collection: jobs