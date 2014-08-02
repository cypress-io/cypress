@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @layout = @getLayoutView(panel)

      @listenTo @layout, "show", ->
        @domContentRegion()

      @show @layout

    domContentRegion: ->
      domView = @getDomView()
      @show domView, region: @layout.domContentRegion

    getDomView: ->
      new DOM.Content
        collection: new App.Entities.Collection [{}, {}]

    getLayoutView: (panel) ->
      new DOM.Layout
        model: panel