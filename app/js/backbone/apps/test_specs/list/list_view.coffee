@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "test_specs/list/list_layout"

  class List.Test extends App.Views.ItemView
    template: "test_specs/list/_test"

  class List.Suite extends App.Views.CompositeView
    template: "test_specs/list/_suite"
    tagName: "ul"
    className: "suite"

    childView: List.Test

    initialize: ->
      @collection = @model.get("tests")

  class List.Suites extends App.Views.CollectionView
    id: "specs-container"

    childView: List.Suite