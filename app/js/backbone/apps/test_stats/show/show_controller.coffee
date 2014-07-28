@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      stats = App.request "stats:entity"

      @listenTo runner, "suite:start", ->
        stats.startCounting()

      @listenTo runner, "suite:stop", ->
        stats.stopCounting()

      @listenTo runner, "test:results:ready", (test) ->
        stats.countTestState(test)

      @listenTo runner, "load:iframe", ->
        ## anytime the iframe needs to be reloaded
        ## we reset our stats back to 0
        stats.reset()

      statsView = @getStatsView stats

      @show statsView

    getStatsView: (stats) ->
      new Show.Stats
        model: stats