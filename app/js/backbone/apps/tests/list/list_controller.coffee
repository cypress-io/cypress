@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files = App.request "file:entities"

      @layout = @getLayoutView()

      @listenTo files, "sync", =>
        @searchRegion(files)
        @recentFilesRegion(files)
        @filesRegion(files)

      @show @layout,
        loading:
          entities: files

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
