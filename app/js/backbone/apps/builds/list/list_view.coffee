@App.module "BuildsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "builds/list/list_layout"

  class List.File extends App.Views.ItemView
    template: "builds/list/_build"

  class List.Empty extends App.Views.ItemView
    template: "builds/list/_empty"

  class List.Files extends App.Views.CollectionView
    childView: List.File
    emptyView: List.Empty
    tagName: "ul"