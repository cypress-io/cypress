@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Project extends App.Views.ItemView
    template: "projects/list/_project"

  class List.Projects extends App.Views.CompositeView
    template: "projects/list/projects"
    childView: List.Project
    childViewContainer: "ul"