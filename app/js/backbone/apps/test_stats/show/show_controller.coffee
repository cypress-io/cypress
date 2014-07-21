@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      stats = App.request "stats:entity"

      @listenTo runner, "suite:start", ->
        stats.startCounting()

      @listenTo runner, "suite:stop", ->
        stats.stopCounting()

      @listenTo runner, "test:end", (test) ->
        stats.countTestState(test)

      statsView = @getStatsView stats

      @show statsView

    getStatsView: (stats) ->
      new Show.Stats
        model: stats