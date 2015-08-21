@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Build extends Entities.Model
    idAttribute: "uuid"

  class Entities.BuildsCollection extends Entities.Collection
    model: Entities.Build

    url: "/__cypress/builds"

  API =
    getBuilds: ->
      builds = new Entities.BuildsCollection [
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d2",
          "buildId": "1892"
          "branch":"search-todos",
          "message": "remove listings from search results on clear"
          "duration":24424,
          "total":28,
          "passed":28,
          "failed":0,
          "pending":0,
          "skipped":0,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z"
        }
      ]
      # builds.fetch
        # reset: true
      builds

  App.reqres.setHandler "build:entities", ->
    API.getBuilds()