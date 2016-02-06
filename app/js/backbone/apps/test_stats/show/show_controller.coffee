@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      stats = @stats = App.request "stats:entity"

      @listenTo runner, "before:run", ->
        stats.running()

      @listenTo runner, "suite:start", ->
        stats.startCounting()

      @listenTo runner, "after:run", ->
        stats.end()
        stats.setGlobally()

      @listenTo runner, "test:end", ->
        stats.setDuration()

      @listenTo runner, "test:results:ready", (test) ->
        stats.countTestState(test)

      @listenTo runner, "change:chosenId", (model, value, options) ->
        chosen = runner.getChosen()
        @chosenRegion runner, chosen

      @listenTo runner, "reset:test:run", ->
        ## anytime the iframe needs to be restarted
        ## we reset our stats back to 0
        stats.reset()

      @listenTo runner, "paused", (nextCmd) ->
        stats.paused(nextCmd)

      @listenTo runner, "resumed", ->
        stats.resume()

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @statsRegion stats
        @configRegion stats, runner

      @show @layout

    onDestroy: ->
      @stats.setGlobally(false)
      @stats = null

    statsRegion: (stats) ->
      statsView = @getStatsView stats
      @show statsView, region: @layout.statsRegion

    configRegion: (stats, runner) ->
      configView = @getConfigView(stats)

      @listenTo configView, "play:clicked", ->
        runner.resume()

      @listenTo configView, "restart:clicked", ->
        runner.restart()

      @listenTo configView, "stop:clicked", ->
        stats.stop()
        runner.abort()

      @listenTo configView, "next:clicked", ->
        stats.disableNext()
        runner.next()

      @show configView, region: @layout.configRegion

    chosenRegion: (runner, chosen) ->
      return @layout.chosenRegion.empty() if not chosen

      chosenView = @getChosenView chosen

      @listenTo chosenView, "close:clicked", ->
        chosen.unchoose()
        runner.setChosen()

      @show chosenView, region: @layout.chosenRegion

    getConfigView: (stats) ->
      new Show.Config
        model: stats

    getChosenView: (chosen) ->
      new Show.Chosen
        model: chosen

    getStatsView: (stats) ->
      new Show.Stats
        model: stats

    getLayoutView: ->
      new Show.Layout