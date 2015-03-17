@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Project extends App.Views.ItemView
    template: "projects/list/_project"
    tagName: "li"
    className: "project"

    triggers:
      "click" : "project:clicked"

    onRender: ->
      @$el.contextmenu
        target: @options.contextMenu
        onItem: =>
          _.defer =>
            @trigger "project:remove:clicked", @model

    onDestroy: ->
      ## destroy the contextmenu so it cleans
      ## up the memory, research into jquery
      ## plugins to see if a destroy method is
      ## automatically invoked with $el is removed?
      @$el.contextmenu("destroy")

  class List.Empty extends App.Views.ItemView
    template: "projects/list/_empty"
    tagName: "li"
    className: "empty"

  class List.Projects extends App.Views.CompositeView
    template: "projects/list/projects"
    childView: List.Project
    emptyView: List.Empty
    childViewContainer: "ul#projects-container"
    childViewOptions:
      "contextMenu" : "#context-menu"

    ui:
      "button"  : "button"
      "input"   : "input"
      "signout" : "li[data-signout]"

    events:
      "mousedown @ui.signout": "signOutClicked"
      # "click @ui.signout" : "signOutClicked"
      "click @ui.button"  : "buttonClicked"
      "change @ui.input"  : "inputChanged"

    signOutClicked: (e) ->
      @trigger "sign:out:clicked"

    buttonClicked: (e) ->
      App.fileDialogOpened = true
      @ui.input.click()

    inputChanged: (e) ->
      App.fileDialogOpened = null
      @trigger "project:added", @ui.input.val()

    onRender: ->
      @ui.signout.dropdown()