@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Project extends Entities.Model
    initialize: ->
      @setName()

    setName: ->
      @set name: @getNameFromPath()

    getNameFromPath: ->
      _(@get("path").split("/")).last()

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  API =
    getProjects: ->
      new Entities.ProjectsCollection

  App.reqres.setHandler "project:entities", ->
    API.getProjects()