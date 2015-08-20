@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "tests/list/list_layout"

  class List.File extends App.Views.CompositeView
    childView: List.File

    childViewContainer: "ul"

    getTemplate: ->
      if @model.get("children").length
        "tests/list/_folder"
      else
        "tests/list/_file"

    initialize: ->
      @collection = @model.get("children")

    onShow: ->
      @$el.addClass("file") if not @model.hasChildren()

      @$el.addClass("all-tests") if @model.get("all")

  class List.Empty extends App.Views.ItemView
    template: "tests/list/_empty"

    serializeData: ->
      path: @options.path

  class List.Files extends App.Views.CollectionView
    childView: List.File
    emptyView: List.Empty
    emptyViewOptions: ->
      path: @collection.path
    tagName: "ul"
    className: "outer-files-container"