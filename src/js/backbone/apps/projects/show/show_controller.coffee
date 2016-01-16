@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      {project, options} = params

      projectView = @getProjectView(project)

      @listenTo projectView, "client:url:clicked", ->
        App.ipc("external:open", project.get("clientUrl"))

      @listenTo projectView, "stop:clicked ok:clicked" , ->
        App.ipc("close:project").then ->
          App.vent.trigger "start:projects:app"

      @show projectView

      _.defaults options,
        onError: ->
        onProjectStart: ->
        onReboot: =>
          project.reset()

          App.ipc("close:project").then =>
            @openProject(project, options)

      _.defer => @openProject(project, options)

    openProject: (project, options) ->
      App.ipc("open:project", {
        path:    project.get("path")
        options: options
      })
      .then (config) ->
        project.setClientUrl(config.clientUrl, config.clientUrlDisplay)

        # App.execute("start:id:generator", config.idGeneratorUrl) if config.idGenerator

        options.onProjectStart(config)

      .catch (err) ->
        project.setError(err)
        options.onError(err)

    getProjectView: (project) ->
      new Show.Project
        model: project