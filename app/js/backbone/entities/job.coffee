@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Job extends Entities.Model
    mutators:
      index: ->
        @collection.indexOf(@) + 1

      icon: ->
        switch @get("os").split(" ")[0]
          when "Windows" then "windows"
          when "Linux"   then "linux"
          when "Mac"     then "apple"

  class Entities.JobsCollection extends Entities.Collection
    model: Entities.Job

  API =
    getNewJobs: (jobs) ->
      new Entities.JobsCollection jobs

  App.reqres.setHandler "new:job:entities", (jobs = []) ->
    API.getNewJobs(jobs)