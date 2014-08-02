@App.module "TestPanelsApp.XHR", (XHR, App, Backbone, Marionette, $, _) ->

  class XHR.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @layout = @getLayoutView(panel)

      @listenTo @layout, "show", ->
        # @xhrContentRegion()

      @show @layout

    getLayoutView: (panel) ->
      new XHR.Layout
        model: panel