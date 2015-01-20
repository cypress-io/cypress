@App.module "ProjectsApp", (ProjectsApp, App, Backbone, Marionette, $, _) ->
  class Router extends App.Routers.Application
    module: ProjectsApp

    actions:
      list: ->
      show: ->

  router = new Router

  App.vent.on "start:projects:app", ->
    router.to "list"

  App.vent.on "project:clicked", (project) ->
    router.to "show", project: project