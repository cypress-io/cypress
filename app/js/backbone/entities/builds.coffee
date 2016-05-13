@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Build extends Entities.Model
    idAttribute: "uuid"

    mutators:
      buildId: ->
        @attributes.buildId ? @attributes.uuid.slice(0, 5)

      message: ->
        _.truncate(@attributes.message, 50)

      status: ->
        switch
          when @get("failed") > 0
            "fail"
          else
            "pass"

      browserNameFormatted: ->
        switch @attributes.browser_name
          when "chrome", "chromium", "canary"
            "chrome"
          when "internet explorer"
            "internet-explorer"
          else
            @attributes.browser_name

      osNameFormatted: ->

        switch @attributes.os_name
          when "mac"
            "apple"
          else
            @attributes.os_name

  class Entities.BuildsCollection extends Entities.Collection
    model: Entities.Build

    comparator: (m) ->
      -moment(m.get("created_at")).unix()

    url: "/__cypress/builds"

  API =
    getBuild: ->
      build = new Entities.Build {
        "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d2",
        "buildId": "1894"
        "branch":"search-todos",
        "message": "remove listings from search results on clear"
        "duration": 1424424,
        "passed": 28,
        "failed": 4,
        "created_at":"2015-08-21T02:35:12.748Z",
        "updated_at":"2015-08-21T02:35:38.687Z",
        "status": "pass",
        "author": "Julie Pearson",
        "browser_name": "chrome",
        "browser_version": "43",
        "os_name": "windows",
        "os_version": "7"
      }
      build

    getBuilds: ->
      models = [
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d2",
          "buildId": "1894"
          "branch":"search-todos",
          "message": "remove listings from search results on clear"
          "duration": 1424424,
          "passed": 28,
          "failed": 0,
          "created_at":"2015-08-21T02:35:12.748Z",
          "updated_at":"2015-08-21T02:35:38.687Z",
          "status": "pass",
          "author": "Julie Pearson",
          "browser_name": "chrome",
          "browser_version": "43",
          "os_name": "windows",
          "os_version": "7"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d3",
          "buildId": "1893"
          "branch":"search-todos",
          "message": "regex remove whitespace"
          "duration": 1324400,
          "passed": 24,
          "failed": 3,
          "created_at":"2016-03-21T02:35:12.748Z",
          "updated_at":"2016-03-21T02:35:38.687Z",
          "status": "fail",
          "author": "Julie Pearson",
          "browser_name": "chrome",
          "browser_version": "43",
          "os_name": "mac",
          "os_version": "OS X"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d4",
          "buildId": "1892"
          "branch":"master",
          "message": "fix for smaller screens widths so todos display completely"
          "duration": 1225424,
          "passed": 17,
          "failed": 1,
          "created_at":"2016-04-21T02:35:12.748Z",
          "updated_at":"2016-04-21T02:35:38.687Z",
          "status": "fail",
          "author": "Brian Mann",
          "browser_name": "internet explorer",
          "browser_version": "9",
          "os_name": "windows",
          "os_version": "XP"
        },
        {
          "uuid": "e474ccb9-0352-4ad9-85d3-feeb1e0505d5",
          "buildId": "1891"
          "branch":"adding-test-branch",
          "message": "spec_helper updated"
          "duration": 1124424,
          "passed": 2,
          "failed": 1,
          "created_at":"2016-05-13T02:35:12.748Z",
          "updated_at":"2016-05-13T02:35:38.687Z",
          "status": "cancel",
          "author": "Julie Pearson",
          "browser_name": "chrome",
          "browser_version": "43",
          "os_name": "windows",
          "os_version": "7"
        }
      ]

      check = (resp) ->
        if not resp.length
          builds.reset(models)

      builds = new Entities.BuildsCollection
      builds.fetch({reset: true})
        .fail(check)
        .done(check)
      builds

  App.reqres.setHandler "build:entities", ->
    API.getBuilds()

  App.reqres.setHandler "build:entity", (id) ->
    API.getBuild id