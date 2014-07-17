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
          @iframeRegion(runner)
          # @specsRegion(runner)
          # @statsRegion(runner)
          # @logRegion(runner)
          # @domRegion(runner)
          # @xhrRegion(runner)

          ## start running the tests
          ## and load the iframe
          runner.start(options.id)

        @show @layout

    iframeRegion: (runner) ->
      App.execute "show:test:iframe", @layout.iframeRegion, runner

    onDestroy: ->
      App.request "stop:test:runner", @runner

    getTestView: ->
      new Show.Test
