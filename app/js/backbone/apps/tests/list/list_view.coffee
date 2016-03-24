@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "tests/list/list_layout"

    triggers:
      "click [data-js='project-name']" : "project:name:clicked"

  class List.Search extends App.Views.ItemView
    template: "tests/list/_search"

  class List.RecentFile extends App.Views.ItemView
    template: "tests/list/_recent_file"
    className: "file"

  class List.RecentFiles extends App.Views.CompositeView
    template: "tests/list/_recent_files"
    childView: List.RecentFile
    childViewContainer: "ul"

  class List.Empty extends App.Views.ItemView
    template: "tests/list/_empty"

    serializeData: ->
      path: @options.path

  class List.File extends App.Views.CompositeView
    childView: List.File
    childViewContainer: "ul"
    tagName: "li"

    events:
      "click": "checkFolderOrFile"

    checkFolderOrFile: (e) ->
      e.stopPropagation()

      if @$el.hasClass("file")
        @goToFile()
      else
        @collapseFolder()

    goToFile: ->
      window.location.hash = "/tests/" + @model.get("fullPath")

    collapseFolder: ->

    getTemplate: ->
      if @model.get("children").length
        "tests/list/_folder"
      else
        "tests/list/_file"

    initialize: ->
      @collection = @model.get("children")

    onRender: ->
      if @model.get("children").length
        @$el.addClass("folder")
      else
        @$el.addClass("file")

      @$el.addClass("all-tests btn btn-primary btn-sm") if @model.get("all")

  class List.Files extends App.Views.CompositeView
    template: "tests/list/_files"
    childView: List.File
    emptyView: List.Empty
    childViewContainer: ".outer-files-container"

    emptyViewOptions: ->
      path: @collection.path

    templateHelpers: ->
      length: @collection.length
