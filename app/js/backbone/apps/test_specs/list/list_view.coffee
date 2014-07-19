@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "test_specs/list/list_layout"

  class List.Test extends App.Views.ItemView
    template: "test_specs/list/_test"

    modelEvents:
      "change:state" : "stateChanged"

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    stateChanged: (model, value, options) ->
      @$el.removeClass().addClass(value)

  class List.Suite extends App.Views.CompositeView
    template: "test_specs/list/_suite"
    className: "suite"
    childView: List.Test
    childViewContainer: "ul"

    initialize: ->
      @collection = @model.get("tests")

  class List.Suites extends App.Views.CollectionView
    tagName: "ul"
    id: "specs-container"
    className: "suite"

    childView: List.Suite