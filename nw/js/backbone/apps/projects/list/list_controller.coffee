@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      projects = App.request "project:entities"

      projectsView = @getProjectsView(projects)

      @listenTo projectsView, "project:added", (path) ->
        App.config.addProject(path)
        projects.add(path: path)

      @listenTo projectsView, "childview:project:clicked", (iv, obj) ->
        App.execute "run:project", obj.model.get("path")

      @show projectsView

    getProjectsView: (projects) ->
      new List.Projects
        collection: projects