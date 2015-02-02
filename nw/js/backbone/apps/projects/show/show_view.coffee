@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Project extends App.Views.ItemView
    template: "projects/show/project"

    modelEvents:
      "change:clientUrl" : "render"

    triggers:
      "click a"       : "client:url:clicked"
      "click button"  : "stop:clicked"