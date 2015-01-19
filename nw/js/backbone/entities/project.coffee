@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Project extends Entities.Model

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

    url: "/projects"

  API =
    getProjects: ->
      new Entities.ProjectsCollection [
        {name: "2Sigma"}
        {name: "WebApp-Node"}
        {name: "Cypress GUI"}
      ]

  App.reqres.setHandler "project:entities", ->
    API.getProjects()