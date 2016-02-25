@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      {project, options} = params

      projectView = @getProjectView(project)

      @listenTo projectView, "client:url:clicked", ->
        App.ipc("external:open", project.get("clientUrl"))

        ## this commented out code runs cypress
        ## inside of electron as an experiment.
        ## leave it for the time being.
        # App.ipc("window:open", {
        #   position: "center"
        #   width: 1280
        #   height: 720
        #   url: project.get("clientUrl")
        #   type: "PROJECT"
        # })

      @listenTo projectView, "stop:clicked ok:clicked" , ->
        App.ipc("close:project").then ->
          App.vent.trigger "start:projects:app"

      @show projectView

      _.defaults options,
        onProjectStart: ->
        onReboot: =>
          project.reset()

          App.ipc("close:project").then =>
            @openProject(project, options)

      _.defer => @openProject(project, options)

    openProject: (project, options) ->
      ## wait at least 750ms even if open:project
      ## resolves faster
      Promise.all([
        App.ipc("open:project", {
          path:    project.get("path")
          options: options
        }),
        Promise.delay(500)
      ])
      .spread (config) ->
        project.setClientUrl(config.clientUrl, config.clientUrlDisplay)

        options.onProjectStart(config)

      .catch (err) ->
        project.setError(err)

    getProjectView: (project) ->
      new Show.Project
        model: project