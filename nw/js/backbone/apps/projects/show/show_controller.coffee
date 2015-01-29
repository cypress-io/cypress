@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      {project} = params

      projectView = @getProjectView(project)

      @listenTo projectView, "client:url:clicked", ->
        App.execute "gui:external:open", project.get("clientUrl")

      @listenTo projectView, "stop:clicked", ->
        App.config.closeProject().then ->
          App.vent.trigger "start:projects:app"

      @show projectView

      _.defer ->
        App.config.runProject(project.get("path")).then (config) ->
          project.setClientUrl(config.clientUrl)
          App.execute "start:id:generator", config.idGeneratorPath

    getProjectView: (project) ->
      new Show.Project
        model: project