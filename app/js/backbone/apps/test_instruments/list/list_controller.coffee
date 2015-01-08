@App.module "TestInstruments.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { test, runner } = options

      instrumentsView = @getInstrumentsView()

      @show instrumentsView

    getInstrumentsView: ->
      new List.Instruments
