@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Xhr extends App.Views.ItemView
    template: "test_commands/list/_xhr"

    events:
      "click" : "clicked"

    clicked: (e) ->
      e.stopPropagation()
      console.log @model.xhr

  class List.Dom extends App.Views.ItemView
    template: "test_commands/list/_dom"

    ui:
      wrapper:  ".command-wrapper"
      pause:    ".fa-pause"
      revert:   ".fa-search"

    triggers:
      "click @ui.pause"   : "pause:clicked"
      "click @ui.revert"  : "revert:clicked"

    events:
      "click" : "clicked"

    onShow: ->
      @ui.wrapper.css "padding-left", @model.get("indent")
      if @model.hasParent()
        @ui.wrapper.addClass "command-child"
      else
        @$el.addClass "command-parent"

    clicked: (e) ->
      e.stopPropagation()
      console.log @model.el

  class List.Commands extends App.Views.CollectionView
    tagName: "ul"
    className: "commands-container"
    getChildView: (command) ->
      switch command.get("type")
        when "dom" then List.Dom
        when "xhr" then List.Xhr
