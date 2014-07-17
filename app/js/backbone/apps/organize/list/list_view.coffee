@Ecl.module "OrganizeApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "organize/list/list_layout"

  class List.File extends App.Views.ItemView
    template: "organize/list/_file"

  class List.Files extends App.Views.CollectionView
    childView: List.File
    tagName: "ul"