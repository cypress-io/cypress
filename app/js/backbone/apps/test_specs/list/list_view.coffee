@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  # class List.Runnable extends App.Views.CompositeView
  #   childViewContainer: "ul"
  #   childView: List.RunnableLayout

  #   getTemplate: ->
  #     switch @model.get("type")
  #       when "test"  then "test_specs/list/_test"
  #       when "suite" then "test_specs/list/_suite"

  #   ## set the className to be either test or suite
  #   attributes: ->
  #     class: @model.get("type") + " runnable"

  #   ui:
  #     pre:        "pre"
  #     label:      "label"
  #     wrapper:    ".runnable-wrapper"
  #     runnables:  ".runnables"
  #     log:        ".runnable-log"
  #     icon:       ".runnable-icon i"

  #   events:
  #     "mouseover"     : "mouseover"
  #     "mouseout"      : "mouseout"
  #     "click @ui.pre" : "preClicked"
  #     "dblclick"      : "dblClicked"
  #     "click"         : "clicked"

  #   modelEvents:
  #     "change:title"  : "render"
  #     "change:state"  : "stateChanged"
  #     "change:error"  : "errorChanged"
  #     "change:chosen" : "chosenChanged"
  #     "change:open"   : "openChanged"

  #   ## this view is a good candidate for stick it

  #   initialize: ->
  #     @collection = @model.get("children")
  #     console.info "@collection", @collection

  #   _renderChildren: ->
  #     ## override the internal method to prevent our composite view from
  #     ## trying to render children into a test (since tests cant have children)
  #     return if @model.get("type") is "test"
  #     super

  #   openChanged: (model, value, options) ->
  #     @hideOrShowRunnableContent()
  #     @changeIconDirection() if @model.is("suite")

  #   hideOrShowRunnableContent: ->
  #     el = if @model.is("test") then @ui.log else @ui.runnables
  #     el.toggleClass("hidden")

  #   changeIconDirection: ->
  #     klass = if @model.get("open") then "right" else "down"
  #     @ui.icon.removeClass().addClass("fa fa-caret-#{klass}")

  #   dblClicked: (e) ->
  #     e.stopPropagation()
  #     @model.trigger "model:double:clicked"

  #   clicked: (e) ->
  #     e.stopPropagation()
  #     @model.toggleOpen()

  #   mouseover: (e) ->
  #     e.stopPropagation()
  #     @$el.addClass("hover")

  #   mouseout: (e) ->
  #     e.stopPropagation()
  #     @$el.removeClass("hover")

  #   chosenChanged: (model, value, options) ->
  #     @$el.toggleClass "active", value

  #   onBeforeRender: ->
  #     @$el.addClass @model.get("state")

  #   onRender: ->
  #     @applyIndent()

  #   applyIndent: (state) ->
  #     indent = @model.get("indent")
  #     indent -= 1 if state is "failed"
  #     @ui.wrapper.css "padding-left", indent

  #   stateChanged: (model, value, options) ->
  #     @$el.removeClass("processing pending failed passed").addClass(value)
  #     @applyIndent(value)

  #     if @model.get("type") is "test"
  #       ## if the test passed check on the duration
  #       @checkDuration() if value is "passed"
  #       @checkTimeout() if value is "failed"

  #   errorChanged: (model, value, options) ->
  #     value or= ""
  #     @ui.pre.text(value)

  #   checkDuration: ->
  #     return if not @model.isSlow()

  #     ## need to add a tooltip here
  #     @ui.label.addClass("label-primary").text(@model.get("duration") + "ms")

  #   checkTimeout: ->
  #     return if not @model.timedOut()

  #     @ui.label.addClass("label-danger").text("Timed Out")

  #   preClicked: (e) ->
  #     return if not error = @model.originalError

  #     ## log out to the console the original error
  #     ## this nukes the original stack trace though...
  #     console.error(error)

  class List.RunnableContent extends App.Views.ItemView
    getTemplate: ->
      switch @model.get("type")
        when "test"  then "test_specs/list/_test"
        when "suite" then "test_specs/list/_suite"

    ui:
      icon:       ".suite-state i"
      ellipsis:   ".suite-title i"
      repeat:     ".fa-repeat"

    events:
      "click @ui.repeat" : "repeatClicked"

    modelEvents:
      "change:open"     : "openChanged"

    openChanged: (model, value, options) ->
      if @model.is("suite")
        @changeIconDirection(value)
        @displayEllipsis(value)

    changeIconDirection: (bool) ->
      klass = if bool then "right" else "down"
      @ui.icon.removeClass().addClass("fa fa-caret-#{klass}")

    displayEllipsis: (bool) ->
      @ui.ellipsis.toggleClass "hidden", !bool

    repeatClicked: (e) ->
      e.stopPropagation()
      @model.trigger "model:double:clicked"

  class List.RunnableLayout extends App.Views.LayoutView
    getTemplate: ->
      switch @model.get("type")
        when "test"  then "test_specs/list/_test_layout"
        when "suite" then "test_specs/list/_suite_layout"

    ## set the className to be either test or suite
    attributes: ->
      class: @model.get("type") + " runnable"

    regions:
      contentRegion:    ".runnable-content-region"
      commandsRegion:   ".runnable-commands-region"
      runnablesRegion:  ".runnables-region"

    ui:
      wrapper:    ".runnable-wrapper"
      runnables:  ".runnables-region"
      commands:   ".runnable-commands-region"
      pre:        "pre"

    events:
      "mouseover"     : "mouseover"
      "mouseout"      : "mouseout"
      # "dblclick"      : "dblClicked"
      "click"         : "clicked"

    modelEvents:
      "get:layout:view" : "getLayoutView"
      "change:title"    : "render"
      "change:state"    : "stateChanged"
      "change:chosen"   : "chosenChanged"
      "change:open"     : "openChanged"
      "change:error"    : "errorChanged"

    onBeforeRender: ->
      @$el.addClass @model.get("state")

    onRender: ->
      @applyIndent()

    mouseover: (e) ->
      e.stopPropagation()
      @$el.addClass("hover")

    mouseout: (e) ->
      e.stopPropagation()
      @$el.removeClass("hover")

    dblClicked: (e) ->
      e.stopPropagation()
      @model.trigger "model:double:clicked"

    clicked: (e) ->
      e.stopPropagation()
      @model.toggleOpen()

    applyIndent: (state) ->
      indent = @model.get("indent")
      indent -= 1 if state is "failed"
      @ui.wrapper.css "padding-left", indent

    getLayoutView: (fn) ->
      fn(@)

    chosenChanged: (model, value, options) ->
      @$el.toggleClass "active", value

    stateChanged: (model, value, options) ->
      @$el.removeClass("processing pending failed passed").addClass(value)
      @applyIndent(value)

      if @model.get("type") is "test"
        ## if the test passed check on the duration
        @checkDuration() if value is "passed"
        @checkTimeout() if value is "failed"

    openChanged: (model, value, options) ->
      ## hide or show the commands or runnables
      el = if @model.is("test") then @ui.commands else @ui.runnables
      el.toggleClass("hidden")

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

  class List.Runnables extends App.Views.CollectionView
    tagName: "ul"
    className: "runnables"
    childView: List.RunnableLayout

    ## add the #specs-list if we're the root view
    onBeforeRender: ->
      @$el.prop("id", "specs-list") if @model.get("root")

    initialize: ->
      @collection = @model.get("children")
