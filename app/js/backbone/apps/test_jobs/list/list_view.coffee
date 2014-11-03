@App.module "TestJobsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Jobs extends App.Views.ItemView
    template: "test_jobs/list/jobs"