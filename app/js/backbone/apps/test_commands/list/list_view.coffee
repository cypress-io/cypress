@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Command extends App.Views.ItemView
    getTemplate: ->
      switch @model.get("type")
        when "xhr"        then "test_commands/list/_xhr"
        when "dom"        then "test_commands/list/_dom"
        when "assertion"  then "test_commands/list/_assertion"
        when "server"     then "test_commands/list/_server"
        else throw new Error("Command .type did not match any template")

    ui:
      wrapper:  ".command-wrapper"
      method:   ".command-method"
      response: ".command-response"
      pause:    ".fa-pause"
      revert:   ".fa-search"

    modelEvents:
      "change:response"  : "render"
      "change:chosen"    : "chosenChanged"

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

      @ui.method.css "padding-left", @model.get("indent")

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

  class List.Commands extends App.Views.CollectionView
    tagName: "ul"
    className: "commands-container"
    childView: List.Command