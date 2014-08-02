@App.module "TestPanelsApp.LOG", (LOG, App, Backbone, Marionette, $, _) ->

  class LOG.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @layout = @getLayoutView(panel)

      @listenTo @layout, "show", ->
        # @logContentRegion()

      @show @layout

    getLayoutView: (panel) ->
      new LOG.Layout
        model: panel