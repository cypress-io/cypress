@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel, runner } = options

      doms = runner.getEntitiesByEvent("dom")

      # @listenTo runner, "dom:added", (model, collection) ->
        # console.log "dom:added", model, collection

      @layout = @getLayoutView(panel)

      @listenTo @layout, "show", ->
        @domContentRegion doms

      @show @layout

    domContentRegion: (doms) ->
      domView = @getDomsView doms
      @show domView, region: @layout.domContentRegion

    getDomsView: (doms) ->
      new DOM.Doms
        collection: doms

    getLayoutView: (panel) ->
      new DOM.Layout
        model: panel