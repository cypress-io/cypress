@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      {project} = params

      projectView = @getProjectView(project)

      @listenTo projectView, "client:url:clicked", ->
        App.execute "gui:external:open", project.get("clientUrl")

      @listenTo projectView, "stop:clicked ok:clicked" , ->
        App.config.closeProject().then ->
          App.vent.trigger "start:projects:app"

      @show projectView

      options = {
        onChromiumRun: (src) ->
          App.execute "start:chromium:run", src
      }

      _.defer ->
        App.config.runProject(project.get("path"), options)
          .then (config) ->
            project.setClientUrl(config.clientUrl, config.clientUrlDisplay)
            App.execute "start:id:generator", config.idGeneratorUrl
          .catch (err) ->
            project.setError(err)

    getProjectView: (project) ->
      new Show.Project
        model: project