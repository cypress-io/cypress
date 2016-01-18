@App.module "ProjectsApp", (ProjectsApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: ProjectsApp

    actions:
      list: ->
      show: ->

  router = new Router

  App.vent.on "start:projects:app", (options) ->
    router.to "list", options

  App.vent.on "project:clicked", (project, options) ->
    router.to "show", project: project, options: options