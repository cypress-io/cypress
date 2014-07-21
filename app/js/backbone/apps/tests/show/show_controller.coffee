@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      ## request and receive the runner entity
      ## which is the mediator of all test framework events
      App.request("start:test:runner").done (runner) =>
        ## store this as a property on ourselves
        @runner = runner

        @layout = @getTestView()

        @listenTo @layout, "show", =>
          @statsRegion(runner)
          @iframeRegion(runner)
          @specsRegion(runner)
          # @logRegion(runner)
          # @domRegion(runner)
          # @xhrRegion(runner)

          ## start running the tests
          ## and load the iframe
          runner.start(options.id)

        @show @layout

    statsRegion: (runner) ->
      App.execute "show:test:stats", @layout.statsRegion, runner

    iframeRegion: (runner) ->
      App.execute "show:test:iframe", @layout.iframeRegion, runner

    specsRegion: (runner) ->
      App.execute "list:test:specs", @layout.specsRegion, runner

    onDestroy: ->
      App.request "stop:test:runner", @runner

    getTestView: ->
      new Show.Test
