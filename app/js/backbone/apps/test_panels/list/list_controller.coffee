@App.module "TestPanelsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { runner } = options

      panels = App.request "panel:entities"

      panelsView = @getPanelsView panels

      @show panelsView

    getPanelsView: (panels) ->
      new List.Panels
        collection: panels