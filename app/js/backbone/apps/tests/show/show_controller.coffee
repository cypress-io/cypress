@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { id, browser, version } = options

      socket = App.request "socket:entity"

      config = App.request "app:config:entity"

      ## this is for any existing controllers which haven't been
      ## closed yet.  this prevents a bug where we try to replace
      ## existing Show controllers which on destroy stop the runner
      @listenTo config, "change:env", (model, value, options) ->
        @region.empty()

      spec = config.getPathToSpec(id)

      @listenTo config, "change:panels", ->
        @layout.resizePanels()

      ## request and receive the runner entity
      ## which is the mediator of all test framework events
      ## store this as a property on ourselves
      runner = App.request("start:test:runner")
      runner.setBrowserAndVersion(browser, version) if browser and version

      @onDestroy = _.partial(@onDestroy, config, runner)

      @listenTo runner, "switch:to:manual:browser", (browser, version) ->
        App.execute "switch:to:manual:browser", id, browser, version

      @listenTo runner, "sauce:running", (jobName, batchId) ->
        @layout.hideIframe()
        @layout.iframeRegion.empty()
        @sauceRegion(runner, jobName, batchId)

      @layout = @getLayoutView config

      @listenTo @layout, "show", =>
        @statsRegion(runner)          if not config.env("satellite")
        @iframeRegion(runner)
        @specsRegion(runner, spec)    if not config.env("satellite")
        # @panelsRegion(runner, config) if not config.env("satellite")

        socket.emit "watch:test:file", id

        ## start running the tests
        ## and load the iframe
        runner.start(id)

        # @layout.resizePanels()

      @show @layout

    statsRegion: (runner) ->
      App.execute "show:test:stats", @layout.statsRegion, runner

    iframeRegion: (runner) ->
      App.execute "show:test:iframe", @layout.iframeRegion, runner

    specsRegion: (runner, spec) ->
      App.execute "list:test:specs", @layout.specsRegion, runner, spec

    sauceRegion: (runner, jobName, batchId) ->
      App.execute "list:test:jobs", @layout.jobsRegion, runner, jobName, batchId

    panelsRegion: (runner, config) ->
      ## trigger the event to ensure the test panels are listed
      ## and pass up the runner
      config.trigger "list:test:panels", runner,
        domRegion: @layout.domRegion
        xhrRegion: @layout.xhrRegion
        logRegion: @layout.logRegion

    onDestroy: (config, runner) ->
      config.trigger "close:test:panels"
      App.request "stop:test:runner", runner

    getLayoutView: (config) ->
      new Show.Layout
        model: config