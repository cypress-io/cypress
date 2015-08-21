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
          "buildId": "1894"
          "branch":"search-todos",
          "message": "remove listings from search results on clear"
          "duration":24424,
          "total":28,
          "passed":28,
          "failed":0,
          "pending":0,
          "skipped":0,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z",
          "status": "pass",
          "user": "Julie Pearson"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d3",
          "buildId": "1893"
          "branch":"search-todos",
          "message": "regex remove whitespace"
          "duration":24424,
          "total":28,
          "passed":24,
          "failed":3,
          "pending":0,
          "skipped":1,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z",
          "status": "fail",
          "user": "Julie Pearson"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d4",
          "buildId": "1892"
          "branch":"master",
          "message": "fix for smaller screens widths so todos display completely"
          "duration":24424,
          "total":22,
          "passed":17,
          "failed":1,
          "pending":4,
          "skipped":0,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z",
          "status": "fail",
          "user": "Brian Mann"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d5",
          "buildId": "1891"
          "branch":"adding-testBranch",
          "message": "spec_helper updated"
          "duration":24424,
          "total":5,
          "passed":2,
          "failed":1,
          "pending":0,
          "skipped":0,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z",
          "status": "cancel",
          "user": "Julie Pearson"
        }
      ]
      # builds.fetch
        # reset: true
      builds

  App.reqres.setHandler "build:entities", ->
    API.getBuilds()