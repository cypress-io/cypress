@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      stats = @stats = App.request "stats:entity"

      @listenTo runner, "suite:start", ->
        stats.startCounting()

      @listenTo runner, "suite:stop", ->
        stats.stopCounting()

      @listenTo runner, "test:results:ready", (test) ->
        stats.countTestState(test)

      @listenTo runner, "change:chosenId", (model, value, options) ->
        chosen = runner.getChosen()
        @chosenRegion runner, chosen

      @listenTo runner, "reset:test:run", ->
        ## anytime the iframe needs to be reloaded
        ## we reset our stats back to 0
        stats.reset()

      @listenTo runner, "runner:end", ->
        stats.setGlobally()

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @statsRegion stats
        @configRegion runner

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

    configRegion: (runner) ->
      configView = @getConfigView()

      @listenTo configView, "sauce:labs:clicked", (option) ->
        # runner.runSauce() if option is "run"

      @show configView, region: @layout.configRegion

    chosenRegion: (runner, chosen) ->
      return @layout.chosenRegion.empty() if not chosen

      chosenView = @getChosenView chosen

      @listenTo chosenView, "close:clicked", ->
        chosen.unchoose()
        runner.setChosen()

      @show chosenView, region: @layout.chosenRegion

    getConfigView: ->
      new Show.Config

    getChosenView: (chosen) ->
      new Show.Chosen
        model: chosen

    getStatsView: (stats) ->
      new Show.Stats
        model: stats

    getLayoutView: ->
      new Show.Layout