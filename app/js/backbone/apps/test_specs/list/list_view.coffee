@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.LayoutView
    template: "test_specs/list/list_layout"

  class List.Test extends App.Views.ItemView
    template: "test_specs/list/_test"

    ui:
      pre: "pre"

    events:
      "click @ui.pre" : "preClicked"
      "mouseover"     : "mouseover"
      "mouseout"      : "mouseout"

    modelEvents:
      "change:state"  : "stateChanged"
      "change:error"  : "errorChanged"
      "change:chosen" : "chosenChanged"

    triggers:
      "click" : "test:clicked"

    mouseover: (e) ->
      e.stopPropagation()
      @$el.addClass("hover")

    mouseout: (e) ->
      e.stopPropagation()
      @$el.removeClass("hover")

    chosenChanged: (model, value, options) ->
      @$el.toggleClass "active", value

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    stateChanged: (model, value, options) ->
      @$el.removeClass("pending failed passed").addClass(value)

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

    events:
      "mouseover"   : "mouseover"
      "mouseout"    : "mouseout"

    triggers:
      "click" : "suite:clicked"

    modelEvents:
      "change:state"  : "stateChanged"
      "change:chosen" : "chosenChanged"

    mouseover: (e) ->
      @$el.addClass("hover")

    mouseout: (e) ->
      @$el.removeClass("hover")

    initialize: ->
      @collection = @model.get("tests")

    chosenChanged: (model, value, options) ->
      @$el.toggleClass "active", value

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    stateChanged: (model, value, options) ->
      @$el.removeClass("pending failed passed").addClass(value)

  class List.Suites extends App.Views.CollectionView
    tagName: "ul"
    id: "specs-container"
    className: "suite"

    childView: List.Suite