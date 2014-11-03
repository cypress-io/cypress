@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  osRegExp =
    windows: /(windows)/
    linux:   /(linux)/
    apple:   /(os x)/

  class Entities.Job extends Entities.Model
    defaults:
      state: "pending"

    mutators:
      stateFormatted: ->
        _.capitalize @get("state")

      stateIcon: ->
        switch @get("state")
          when "pending" then "fa fa-refresh fa-spin"
          when "passed"  then "fa fa-check"
          when "failed"  then "fa fa-times"
          when "error"   then "fa fa-warning"

      index: ->
        @collection.indexOf(@) + 1

      icon: ->
        os = @get("os").toLowerCase()

        for key, re of osRegExp
          return key if re.test(os)

    done: (results) ->
      @results = results
      @set "state", "passed"

      # @set "state", results.state

    fail: (err) ->
      @err = err
      @set "state", "error"

  class Entities.JobsCollection extends Entities.Collection
    model: Entities.Job

    done: (id, results) ->
      if job = @getById(id)
        job.done(results)

    fail: (id, err) ->
      if job = @getById(id)
        job.fail(err)

    getById: (id) ->
      job = @get(id)

      if not job
        console.warn("Could not find any job for id: #{id}")
      else
        job

  API =
    getNewJobs: (jobs) ->
      new Entities.JobsCollection jobs

  App.reqres.setHandler "new:job:entities", (jobs = []) ->
    API.getNewJobs(jobs)