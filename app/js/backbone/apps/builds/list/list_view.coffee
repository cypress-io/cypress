@App.module "BuildsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "builds/list/list_layout"

  class List.Build extends App.Views.ItemView
    template: "builds/list/_build"
    tagName: "li"

  class List.Empty extends App.Views.ItemView
    template: "builds/list/_empty"

  class List.Builds extends App.Views.CompositeView
    template: "builds/list/_builds"
    childView: List.Build
    childViewContainer: ".builds-container"
    emptyView: List.Empty