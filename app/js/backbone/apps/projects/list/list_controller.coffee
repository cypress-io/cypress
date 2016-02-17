@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (params) ->
      _.defaults params,
        projectPath: null
        onProjectNotFound: ->

      @displayProjects(params)

    displayProjects: (params) ->
      projects = App.request "project:entities"

      user = App.request "current:user"

      projectsView = @getProjectsView(projects, user)

      addProject = =>
        App.ipc("show:directory:dialog")
        .then (dirPath) ->
          ## if the user cancelled the dialog selection
          ## dirPath will be undefined
          return if not dirPath

          ## initially set our project to be loading state
          project = projects.add({path: dirPath, loading: true})

          ## wait at least 750ms even if add:project
          ## resolves faster to prevent the sudden flash
          ## of loading content which is jarring
          Promise.all([
            App.ipc("add:project", dirPath),
            Promise.delay(750)
          ])
          .then ->
            ## our project is now in the loaded state
            ## and can be started
            project.loaded()

        .catch (err) =>
          @displayError(err.message, params)

      startProject = (project, options = {}) ->
        App.vent.trigger "project:clicked", project, options

      if projectPath = params.projectPath
        @listenTo projectsView, "show", ->
          project = projects.getProjectByPath(projectPath)

          ## if we couldnt find this project then bail
          return params.onProjectNotFound(projectPath) if not project

          startProject(project, params)
      else
        @listenTo projectsView, "add:project:clicked", addProject

        ## listen for the button in our empty view too
        @listenTo projectsView, "childview:add:project:clicked", addProject

        @listenTo projectsView, "sign:out:clicked", ->
          App.vent.trigger "log:out", user

        @listenTo projectsView, "childview:project:clicked", (iv, obj) ->
          project = obj.model

          ## bail if our project is loading
          return if project.isLoading()

          startProject(project, params)

        @listenTo projectsView, "childview:project:remove:clicked", (iv, project) ->
          projects.remove(project)

          App.ipc("remove:project", project.get("path"))

      @listenTo projects, "fetched", ->
        @show projectsView

    displayError: (msg, params) ->
      errorView = @getErrorView(msg)

      @show errorView

      ## we'll lose all event listeners
      ## if we attach this before show
      ## so we need to wait until after
      @listenTo errorView, "ok:clicked", ->
        @displayProjects(params)

    getErrorView: (msg) ->
      new List.Error
        message: msg

    getProjectsView: (projects, user) ->
      new List.Projects
        collection: projects
        model: user