@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      projects = App.request "project:entities"

      projectsView = @getProjectsView(projects)

      @show projectsView

    getProjectsView: (projects) ->
      new List.Projects
        collection: projects