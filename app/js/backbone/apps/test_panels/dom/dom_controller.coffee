@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel, runner } = options

      doms = runner.getEntitiesByEvent("dom")

      @layout = @getLayoutView(panel)

      @listenTo @layout, "show", ->
        @domContentRegion doms, runner

      @show @layout

    domContentRegion: (doms, runner) ->
      domView = @getDomsView doms

      @listenTo domView, "childview:revert:clicked", (iv, args) ->
        runner.revertDom(args.model)

      @show domView, region: @layout.domContentRegion

    getDomsView: (doms) ->
      new DOM.Doms
        collection: doms

    getLayoutView: (panel) ->
      new DOM.Layout
        model: panel