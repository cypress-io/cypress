@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { navs } = options

      config   = App.request "app:config:entity"

      @listenTo config, "list:test:panels", (runner) ->
        @panelsRegion runner

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @navsRegion(navs, config)

      @show @layout

    navsRegion: (navs, config) ->
      navView = @getNavView(navs, config)

      @show navView, region: @layout.navRegion

    panelsRegion: (runner) ->
      App.execute "list:test:panels", @layout.panelsRegion, runner

    getNavView: (navs, config) ->
      new List.Navs
        collection: navs
        model: config

    getLayoutView: ->
      new List.Layout