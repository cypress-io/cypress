@App.module "TestPanelsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { runner } = options

      config = App.request "app:config:entity"
      panels = App.request "panel:entities"

      ## when panels chooses/unchooses we need to update our app config
      @listenTo panels, "change:chosen", (model, value, options) ->
        config.togglePanel model, value

      panelsView = @getPanelsView panels

      @show panelsView

    getPanelsView: (panels) ->
      new List.Panels
        collection: panels