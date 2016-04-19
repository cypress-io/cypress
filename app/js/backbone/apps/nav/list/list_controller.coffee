@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { navs } = options

      config   = App.request "app:config:entity"

      ## make sure we empty this region since we're
      ## in control of it
      @listenTo config, "close:test:panels", ->
        @layout.panelsRegion.empty()

      @listenTo config, "remove:nav", ->
        @layout.satelliteMode()
        @layout.destroy()

      @listenTo config, "change:ui", (model, value, options) ->
        ## if we're entering satellite mode then hide our layout
        ## and update some DOM classes for display purposes
        return @layout.satelliteMode() if value is "satellite"

        ## else if our previous ui attribute was satellite then
        ## we need to show our layout and re-render our navs region
        if model.previous("ui") is "satellite"
          @navsRegion(navs, config)
          @layout.satelliteMode(false)

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @navsRegion(navs, config)
        new window.gitter.Chat({room: "cypress-io/cypress", activationElement: ".gitter-open"})

      @show @layout

    navsRegion: (navs, config) ->
      navView = @getNavView(navs, config)

      @show navView, region: @layout.navRegion

    getNavView: (navs, config) ->
      new List.Navs
        collection: navs
        model: config

    getLayoutView: ->
      new List.Layout