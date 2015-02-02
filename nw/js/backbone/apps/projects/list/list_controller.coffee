@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      projects = App.request "project:entities"

      user = App.request "current:user"

      projectsView = @getProjectsView(projects, user)

      @listenTo projectsView, "project:added", (path) ->
        App.config.addProject(path).then ->
          projects.add(path: path)

      @listenTo projectsView, "sign:out:clicked", ->
        App.vent.trigger "log:out", user

      @listenTo projectsView, "childview:project:clicked", (iv, obj) ->
        App.vent.trigger "project:clicked", obj.model

      @show projectsView

    getProjectsView: (projects, user) ->
      new List.Projects
        collection: projects
        model: user