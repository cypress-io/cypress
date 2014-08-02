@App.module "TestPanelsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { runner, regions } = options

      config = App.request "app:config:entity"
      panels = App.request "panel:entities"

      ## when panels chooses/unchooses we need to update our app config
      @listenTo panels, "change:chosen", (model, value, options) ->
        @panelRegion model, value, regions, runner
        config.togglePanel model, value

      panels.setInitialStateByConfig config.get("panels")

      panelsView = @getPanelsView panels

      @show panelsView

    panelRegion: (panel, show, regions, runner) ->
      region = @getRegion(panel.get("name"), regions)

      ## if we're supposed to show the panel then fire the app command
      if show
        App.execute "show:panel", panel, region, runner
      else
        ## just close the region
        region.empty()

    getRegion: (name, regions) ->
      regions[name.toLowerCase() + "Region"] or throw new Error("Did not find a valid region for: #{name}")

    getPanelsView: (panels) ->
      new List.Panels
        collection: panels