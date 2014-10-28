@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      {id, __env} = options

      config = App.request "app:config:entity"

      ## cause the app to enter a special app mode if __env is set
      App.execute "set:app:env", __env
      config.trigger "enter:app:env:mode", __env if __env

      spec = config.getPathToSpec(id)

      @listenTo config, "change:panels", ->
        @layout.resizePanels()

      @onDestroy = _.partial(@onDestroy, config)

      ## request and receive the runner entity
      ## which is the mediator of all test framework events
      ## store this as a property on ourselves
      @runner = runner = App.request("start:test:runner")

      @layout = @getLayoutView config

      @listenTo @layout, "show", =>
        @statsRegion(runner)          if __env isnt "satellite"
        @iframeRegion(runner)
        @specsRegion(runner, spec)    if __env isnt "satellite"
        @panelsRegion(runner, config) if __env isnt "satellite"

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

    panelsRegion: (runner, config) ->
      ## trigger the event to ensure the test panels are listed
      ## and pass up the runner
      config.trigger "list:test:panels", runner,
        domRegion: @layout.domRegion
        xhrRegion: @layout.xhrRegion
        logRegion: @layout.logRegion

    onDestroy: (config) ->
      config.trigger "close:test:panels"
      App.request "stop:test:runner", @runner
      delete @runner

    getLayoutView: (config) ->
      new Show.Layout
        model: config