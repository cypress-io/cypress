@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Command extends App.Views.ItemView
    getTemplate: ->
      switch @model.get("type")
        when "xhr"        then "test_commands/list/_xhr"
        when "dom"        then "test_commands/list/_dom"
        when "assertion"  then "test_commands/list/_assertion"
        when "server"     then "test_commands/list/_server"
        else
          throw new Error("Command .type did not match any template")

    ui:
      wrapper:  ".command-wrapper"
      method:   ".command-method"
      response: ".command-response"
      # pause:    ".fa-pause"
      revert:   ".fa-search"

    modelEvents:
      "change:response"  : "render"
      "change:chosen"    : "chosenChanged"
      "change:highlight" : "highlightChanged"

    triggers:
      "click @ui.pause"   : "pause:clicked"
      "click @ui.revert"  : "revert:clicked"
      "mouseenter"        : "command:mouseenter"
      "mouseleave"        : "command:mouseleave"

    events:
      "click"               : "clicked"
      "click @ui.response"  : "responseClicked"

    onShow: ->
      @$el.addClass "command-type-#{@model.get("type")}"

      switch @model.get("type")
        when "dom"
          ## quick hack to get sub types
          @$el.addClass "command-type-dom-action" if not @model.isParent()

        when "assertion"
          klass = if @model.get("passed") then "passed" else "failed"
          @$el.addClass "command-type-assertion-#{klass}"

      # @ui.method.css "padding-left", @model.get("indent")

      if @model.hasParent()
        @ui.wrapper.addClass "command-child"
      else
        @$el.addClass "command-parent"

      @$el.addClass "command-cloned" if @model.isCloned()

    clicked: (e) ->
      e.stopPropagation()
      _.each @model.getPrimaryObjects(), (obj, index) ->
        obj = if _.isArray(obj) then obj else [obj]
        console.log obj...

    responseClicked: (e) ->
      e.stopPropagation()
      response = @model.xhr.responseText

      try
        response = JSON.parse response

      console.log "Status:     ", @model.xhr.status
      console.log "URL:        ", @model.xhr.url
      console.log "Matched URL:", @model.response.url
      console.log "Request:    ", @model.xhr
      console.log "Response:   ", response

    chosenChanged: (model, value, options) ->
      @$el.toggleClass "active", value

    highlightChanged: (model, value, options) ->
      @$el.toggleClass "highlight", value

  class List.Hook extends App.Views.CompositeView
    template: "test_commands/list/_hook"
    tagName: "li"
    className: "hook-item"
    childView: List.Command
    childViewContainer: "ul"

    ui:
      "commands" : ".commands-container"
      "caret"    : "i.fa-caret-down"
      "ellipsis" : "i.fa-ellipsis-h"
      "failed"   : ".hook-failed"

    modelEvents:
      "change:visible" : "visibleChanged"
      "change:failed"  : "failedChanged"

    events:
      "click .hook-name" : "hookClicked"

    initialize: ->
      @collection = @model.get("commands")

    hookClicked: (e) ->
      @model.toggle()
      e.preventDefault()
      e.stopPropagation()

    visibleChanged: (model, value, options) ->
      @ui.commands.toggleClass "hidden", !value
      @changeIconDirection(!value)
      @displayEllipsis(!value)

    changeIconDirection: (bool) ->
      klass = if bool then "right" else "down"
      @ui.caret.removeClass().addClass("fa fa-caret-#{klass}")

    displayEllipsis: (bool) ->
      @ui.ellipsis.toggleClass "hidden", !bool

    failedChanged: (model, bool, options) ->
      @ui.failed.toggleClass "hidden", !bool

  class List.Hooks extends App.Views.CollectionView
    tagName: "ul"
    className: "hooks-container"
    childView: List.Hook