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
        switch @get("state")
          when "pending" then "Connecting to Sauce Labs..."
          else
            _.capitalize @get("state")

      stateIcon: ->
        switch @get("state")
          when "pending" then "fa fa-cloud-upload"
          when "running" then "fa fa-spin fa-refresh"
          when "passed"  then "fa fa-check"
          when "failed"  then "fa fa-times"
          when "error"   then "fa fa-warning"

      timeFormatted: ->
        Math.floor(@get("time") / 1000)

      index: ->
        @collection.indexOf(@) + 1

      icon: ->
        os = @get("os").toLowerCase()

        for key, re of osRegExp
          return key if re.test(os)

    start: (id) ->
      @set "id", id, {silent: true}
      @set "state", "running"

    done: (runningTime, results) ->
      @results = results
      @set "time", runningTime, {silent: true}
      @set "state", "passed"

      # @set "state", results.state

    fail: (err) ->
      @err = err
      @set "state", "error"

  class Entities.JobsCollection extends Entities.Collection
    model: Entities.Job

    startJobByGuid: (guid, id) ->
      if job = @findWhere(guid: guid)
        job.start(id)

    done: (id, runningTime, results) ->
      if job = @getById(id)
        job.done(runningTime, results)

    fail: (id, err) ->
      if job = @getById(id)
        job.fail(err)

    getById: (id) ->
      ## cannot use 'get' here because our models
      ## dont start with an 'id' attribute
      job = @findWhere(id: id)

      if not job
        console.warn("Could not find any job for id: #{id}")
      else
        job

  API =
    getNewJobs: (jobs) ->
      new Entities.JobsCollection jobs

  App.reqres.setHandler "new:job:entities", (jobs = []) ->
    API.getNewJobs(jobs)