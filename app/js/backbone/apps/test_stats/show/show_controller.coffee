@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      stats = @stats = App.request "stats:entity"

      @listenTo runner, "suite:start", ->
        stats.startCounting()

      @listenTo runner, "after:run", ->
        stats.stopCounting()

      @listenTo runner, "test:end", ->
        stats.setDuration()

      @listenTo runner, "test:results:ready", (test) ->
        stats.countTestState(test)

      @listenTo runner, "change:chosenId", (model, value, options) ->
        chosen = runner.getChosen()
        @chosenRegion runner, chosen

      @listenTo runner, "reset:test:run", ->
        ## anytime the iframe needs to be reloaded
        ## we reset our stats back to 0
        stats.reset()

      @listenTo runner, "after:run", ->
        stats.setGlobally()

      @listenTo runner, "paused", (nextCmd) ->
        stats.pause(nextCmd)

      @listenTo runner, "resumed", ->
        stats.resume()

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @statsRegion stats
        @configRegion stats, runner

      @show @layout

    onDestroy: ->
      ## make sure we stop counting just in case we've clicked
      ## between test specs too quickly!
      @stats.stopCounting()
      @stats.setGlobally(false)
      @stats = null

    statsRegion: (stats) ->
      statsView = @getStatsView stats
      @show statsView, region: @layout.statsRegion

    configRegion: (stats, runner) ->
      configView = @getConfigView(stats)

      @listenTo configView, "resume:clicked", ->
        runner.resume()

      @listenTo configView, "next:clicked", ->
        runner.next()

      @listenTo configView, "clicked:sauce:labs", (option) ->
        runner.runSauce()

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