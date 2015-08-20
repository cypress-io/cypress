@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Build extends Entities.Model

  class Entities.BuildsCollection extends Entities.Collection
    model: Entities.Build

    url: "/__cypress/builds"

  API =
    getBuilds: ->
      builds = new Entities.BuildsCollection
      builds.fetch
        reset: true
      builds

  App.reqres.setHandler "build:entities", ->
    API.getBuilds()