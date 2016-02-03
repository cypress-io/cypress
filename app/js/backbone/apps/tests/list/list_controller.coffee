@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files  = App.request "file:entities"
      socket = App.request "socket:entity"

      @layout = @getLayoutView()

      ## if this is our first time visiting files
      ## after adding the project, we want to onboard
      @listenTo @layout, "show", ->
        socket.emit "is:new:project", (bool) ->
          files.trigger("is:new:project", bool)

      @listenTo files, "is:new:project", (bool) ->
        @onboardingRegion() if bool

      @listenTo files, "sync", =>
        # @searchRegion(files) if files.length
        # @recentFilesRegion(files)
        @filesRegion(files)

      @show @layout,
        loading:
          entities: files

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

    filesRegion: (files) ->
      files.resetToTreeView()

      files.prependWithAllTests() if files.length

      filesView = @getFilesView files

      @show filesView,
        region: @layout.allFilesRegion

    getLayoutView: ->
      new List.Layout

    getSearchView: (files) ->
      new List.Search
        collection: files

    getRecentFilesView: (files) ->
      new List.RecentFiles
        collection: files

    getFilesView: (files) ->
      new List.Files
        collection: files
