@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (params) ->
      projects = App.request "project:entities"

      user = App.request "current:user"

      projectsView = @getProjectsView(projects, user)

      startProject = (project) ->
        App.vent.trigger "project:clicked", project

      if projectPath = params.projectPath
        @listenTo projectsView, "show", ->
          project = projects.getProjectByPath(projectPath)

          ## TODO handle if project cannot be found by path
          ## perhaps try to add the project first?
          throw new Error("Project could not be found by path: #{projectPath}") if not project

          startProject(project)
      else
        @listenTo projectsView, "project:added", (path) ->
          App.config.addProject(path).then ->
            projects.add(path: path)

        @listenTo projectsView, "sign:out:clicked", ->
          App.vent.trigger "log:out", user

        @listenTo projectsView, "childview:project:clicked", (iv, obj) ->
          startProject(obj.model)

        @listenTo projectsView, "childview:project:remove:clicked", (iv, project) ->
          App.config.removeProject(project.get("path"))
          projects.remove(project)

      @listenTo projects, "fetched", ->
        @show projectsView

    getProjectsView: (projects, user) ->
      new List.Projects
        collection: projects
        model: user