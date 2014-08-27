@App.module "OrganizeApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files = App.request "file:entities"

      @layout = @getLayoutView()

      @listenTo @layout, "show", =>
        @filesRegion(files)

      @show @layout,
        loading:
          entities: files

    filesRegion: (files) ->
      filesView = @getFilesView files

      @show filesView, region: @layout.filesRegion

    getLayoutView: ->
      new List.Layout

    getFilesView: (files) ->
      new List.Files
        collection: files
