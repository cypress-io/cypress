@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  chat = window.gitter.chat.defaultChat

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { navs } = options

      config = App.request "app:config:entity"
      socket = App.request "socket:entity"

      ## if we receive an automation:disconnected event
      ## it means that we were once connected but now are
      ## lost and we need to shut down the entire app
      ## and just let the user reload the browser.
      @listenTo socket, "automation:disconnected", ->
        @layout.destroy()
        App.execute("show:automation")

      @listenTo config, "change:gitter", (model, value, options) ->
        chat.toggleChat(value)
        navs.toggleChat()

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
          @navsRegion(navs, config, chat)
          @layout.satelliteMode(false)

      @layout = @getLayoutView()

      @listenTo @layout, "gitter:toggled", (bool) ->
        config.set "gitter", bool

      @listenTo @layout, "show", ->
        @navsRegion(navs, config, chat)

      @show @layout

    navsRegion: (navs, config, chat) ->
      navView = @getNavView(navs, config)

      @listenTo navView, "childview:gitter:toggle:clicked", ->
        config.toggleGitter()

      @show navView, region: @layout.navRegion

    getNavView: (navs, config) ->
      new List.Navs
        collection: navs
        model: config

    getLayoutView: ->
      new List.Layout
