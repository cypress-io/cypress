@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.RunnableContent extends App.Views.ItemView
    getTemplate: ->
      switch @model.get("type")
        when "test"  then "test_specs/list/_test"
        when "suite" then "test_specs/list/_suite"

    ui:
      label:      "label"
      icon:       ".suite-state i"
      ellipsis:   ".suite-title i"
      repeat:     ".fa-repeat"

    events:
      "click @ui.repeat" : "repeatClicked"

    modelEvents:
      "change:open"     : "openChanged"
      "change:state"    : "stateChanged"

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

    stateChanged: (model, value, options) ->
      @countCommands()

      if @model.get("type") is "test"
        ## if the test passed check on the duration
        # @checkDuration() if value is "passed"
        @checkTimeout() if value is "failed"
        @checkCommands() if value is "failed"

    checkDuration: ->
      return if not @model.isSlow()

      ## need to add a tooltip here
      @ui.label.addClass("label-warning").text(@model.get("duration") + "ms")

    checkTimeout: ->
      return if not @model.timedOut()

      @ui.label.addClass("label-danger").text("Timed Out")

    checkCommands: ->
      @ui.label.removeClass("label-success").addClass("label-danger") if @model.anyCommandsFailed()

    countCommands: ->
      commands = @model.get("commands").getTotalNumber()
      @ui.label.addClass("label-success").text(commands) if commands > 0

  class List.RunnableLayout extends App.Views.LayoutView
    getTemplate: ->
      switch @model.get("type")
        when "test"  then "test_specs/list/_test_layout"
        when "suite" then "test_specs/list/_suite_layout"
        else
          throw new Error("Model type: #{@model.get('type')} does not match 'test' or 'suite'")

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
      "click @ui.pre" : "preClicked"
      "mouseover .commands-container" : "commandsMouseover"

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

    commandsMouseover: (e) ->
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

    openChanged: (model, value, options) ->
      ## hide or show the commands or runnables
      el = if @model.is("test") then @ui.commands else @ui.runnables
      el.toggleClass("hidden")

    errorChanged: (model, value, options) ->
      value or= ""
      @ui.pre.text(value)

    preClicked: (e) ->
      return if not @model.originalError

      console.error(@model.originalError.stack)

  class List.Runnables extends App.Views.CollectionView
    tagName: "ul"
    className: "runnables"
    childView: List.RunnableLayout

    ## add the #specs-list if we're the root view
    onBeforeRender: ->
      @$el.prop("id", "specs-list") if @model.get("root")

    initialize: ->
      @collection = @model.get("children")

    resortView: ->
      @collection.each (model, index) =>
        view = @children.findByModel(model)
        @moveViewToIndex(view, index) if view._index isnt index

    moveViewToIndex: (view, index) ->
      view._index = index
      sibling = view.$el.siblings().eq(index)
      view.$el.insertBefore(sibling)

