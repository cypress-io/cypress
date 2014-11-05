@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { navs } = options

      config   = App.request "app:config:entity"

      @listenTo config, "list:test:panels", (runner, regions) ->
        @panelsRegion runner, regions

      ## make sure we empty this region since we're
      ## in control of it
      @listenTo config, "close:test:panels", ->
        @layout.panelsRegion.empty()

      @listenTo config, "remove:nav", ->
        @layout.satelliteMode()
        @layout.destroy()

      @listenTo config, "change:env", (model, value, options) ->
        ## if we're entering satellite mode then hide our layout
        ## and update some DOM classes for display purposes
        return @layout.satelliteMode() if value is "satellite"

        ## else if our previous env attribute was satellite then
        ## we need to show our layout and re-render our navs region
        if model.previous("env") is "satellite"
          @navsRegion(navs, config)
          @layout.satelliteMode(false)

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @navsRegion(navs, config)

      @show @layout

    navsRegion: (navs, config) ->
      navView = @getNavView(navs, config)

      @show navView, region: @layout.navRegion

    panelsRegion: (runner, regions) ->
      App.execute "list:test:panels", @layout.panelsRegion, runner, regions

    getNavView: (navs, config) ->
      new List.Navs
        collection: navs
        model: config

    getLayoutView: ->
      new List.Layout