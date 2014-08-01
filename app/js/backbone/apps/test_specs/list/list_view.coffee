@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Runnable extends App.Views.CompositeView
    childViewContainer: "ul"

    getTemplate: ->
      switch @model.get("type")
        when "test"  then "test_specs/list/_test"
        when "suite" then "test_specs/list/_suite"

    ## set the className to be either test or suite
    attributes: ->
      class: @model.get("type")

    ui:
      pre: "pre"
      label: "label"

    events:
      "mouseover"     : "mouseover"
      "mouseout"      : "mouseout"
      "click @ui.pre" : "preClicked"
      "click"         : "clicked"

    modelEvents:
      "change:title"  : "render"
      "change:state"  : "stateChanged"
      "change:error"  : "errorChanged"
      "change:chosen" : "chosenChanged"

    ## this view is a good candidate for stick it

    initialize: ->
      @collection = @model.get("children")

    _renderChildren: ->
      ## override the internal method to prevent our composite view from
      ## trying to render children into a test (since tests cant have children)
      return if @model.get("type") is "test"
      super

    clicked: (e) ->
      e.stopPropagation()
      @model.trigger "model:clicked"

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
      @$el.removeClass("processing pending failed passed").addClass(value)

      if @model.get("type") is "test"
        ## if the test passed check on the duration
        @checkDuration() if value is "passed"
        @checkTimeout() if value is "failed"

    errorChanged: (model, value, options) ->
      value or= ""
      @ui.pre.text(value)

    checkDuration: ->
      return if not @model.isSlow()

      ## need to add a tooltip here
      @ui.label.addClass("label-primary").text(@model.get("duration") + "ms")

    checkTimeout: ->
      return if not @model.timedOut()

      @ui.label.addClass("label-danger").text("Timed Out")

    preClicked: (e) ->
      return if not error = @model.originalError

      ## log out to the console the original error
      ## this nukes the original stack trace though...
      console.error(error)

  class List.Root extends App.Views.CollectionView
    tagName: "ul"
    id: "specs-container"
    childView: List.Runnable

    initialize: ->
      @collection = @model.get("children")
