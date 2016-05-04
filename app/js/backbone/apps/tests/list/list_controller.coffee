@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files  = App.request "file:entities"
      socket = App.request "socket:entity"
      config = App.request "app:config:entity"

      @layout = @getLayoutView(config)

      @listenTo socket, "change:automationConnected", ->
        @extensionMessage(socket)

      ## if this is our first time visiting files
      ## after adding the project, we want to onboard
      @listenTo @layout, "show", ->
        socket.emit "is:new:project", (bool) ->
          files.trigger("is:new:project", bool)

        @extensionMessage(socket)

      @listenTo @layout, "project:name:clicked", ->
        socket.emit "open:finder", config.get("parentTestsFolder")

      @listenTo files, "is:new:project", (bool) ->
        @onboardingRegion() if bool

      @listenTo files, "sync", =>
        # @searchRegion(files) if files.length
        # @recentFilesRegion(files)
        @filesRegion(files, config)

      @show @layout,
        loading:
          entities: files

    extensionMessage: (socket) ->
      switch socket.get("automationConnected")
        when true
          if r = @layout.extensionBannerRegion
            r.empty()
        when false
          extensionMessageView = @getExtensionMessageView()

          @show extensionMessageView,
            region: @layout.extensionBannerRegion

    onboardingRegion: ->
      App.execute "show:files:onboarding"

    searchRegion: (files) ->
      searchView = @getSearchView files

      @show searchView,
        region: @layout.searchRegion

    recentFilesRegion: (files) ->
      recentFilesView = @getRecentFilesView files

      @show recentFilesView,
        region: @layout.recentFilesRegion

    filesRegion: (files, config) ->
      files.resetToTreeView()

      files.prependWithAllTests() if files.length

      filesView = @getFilesView files, config

      @show filesView,
        region: @layout.allFilesRegion

    getExtensionMessageView: ->
      new List.ExtensionMessage

    getLayoutView: (config) ->
      new List.Layout
        model: config

    getSearchView: (files) ->
      new List.Search
        collection: files

    getRecentFilesView: (files) ->
      new List.RecentFiles
        collection: files

    getFilesView: (files, config) ->
      new List.Files
        collection: files
        config: config
