@App.module "OrganizeApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files = App.request "file:entities"

      @layout = @getLayoutView()

      @listenTo files, "sync", =>
        @searchRegion(files)
        @filesRegion(files)

      @show @layout,
        loading:
          entities: files

    searchRegion: (files) ->
      searchView = @getSearchView files

      @show searchView,
        region: @layout.searchRegion

    filesRegion: (files) ->
      files.resetToTreeView()

      filesView = @getFilesView files

      @show filesView,
        region: @layout.filesRegion

    getLayoutView: ->
      new List.Layout

    getSearchView: (files) ->
      new List.Search
        collection: files

    getFilesView: (files) ->
      new List.Files
        collection: files
