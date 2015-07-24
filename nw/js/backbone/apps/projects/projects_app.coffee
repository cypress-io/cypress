@App.module "ProjectsApp", (ProjectsApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: ProjectsApp

    actions:
      list: ->
      show: ->

  router = new Router

  App.vent.on "start:projects:app", (projectPath) ->
    router.to "list", {projectPath: projectPath}

  App.vent.on "project:clicked", (project, headless) ->
    router.to "show", project: project, headless: headless