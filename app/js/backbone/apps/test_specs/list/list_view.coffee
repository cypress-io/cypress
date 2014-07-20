@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "test_specs/list/list_layout"

  class List.Test extends App.Views.ItemView
    template: "test_specs/list/_test"

    ui:
      pre: "pre"

    events:
      "click @ui.pre" : "preClicked"

    modelEvents:
      "change:state" : "stateChanged"
      "change:error" : "errorChanged"

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    stateChanged: (model, value, options) ->
      @$el.removeClass().addClass(value)

    errorChanged: (model, value, options) ->
      @ui.pre.text(value)

    preClicked: (e) ->
      return if not error = @model.originalError

      ## log out to the console the original error
      ## this nukes the original stack trace though...
      console.error(error)

  class List.Suite extends App.Views.CompositeView
    template: "test_specs/list/_suite"
    className: "suite"
    childView: List.Test
    childViewContainer: "ul"

    modelEvents:
      "change:state" : "stateChanged"

    initialize: ->
      @collection = @model.get("tests")

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    stateChanged: (model, value, options) ->
      @$el.removeClass("pending failed passed").addClass(value)

  class List.Suites extends App.Views.CollectionView
    tagName: "ul"
    id: "specs-container"
    className: "suite"

    childView: List.Suite