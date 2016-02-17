@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Error extends App.Views.ItemView
    template: "projects/list/_error"
    templateHelpers: ->
      message: @options.message
    triggers:
      "click [data-ok]" : "ok:clicked"

  class List.Project extends App.Views.ItemView
    template: "projects/list/_project"
    tagName: "li"
    className: "project"

    modelEvents:
      "change:loading" : "render"

    triggers:
      "click" : "project:clicked"

    onRender: ->
      ## flip between these two classes
      @$el.toggleClass("loading", @model.isLoading())
      @$el.toggleClass("loaded", !@model.isLoading())

    onShow: ->
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

    ui:
      "addProject"  : "[data-js='add-project']"

    triggers:
      "click @ui.addProject" : "add:project:clicked"

  class List.Projects extends App.Views.CompositeView
    template: "projects/list/projects"
    childView: List.Project
    emptyView: List.Empty
    childViewContainer: "ul#projects-container"
    childViewOptions:
      "contextMenu" : "#context-menu"

    ui:
      "addProject"  : "[data-js='add-project']"
      "input"       : "input"
      "signout"     : "li[data-signout]"

    events:
      "mousedown @ui.signout": "signOutClicked"
      # "click @ui.signout" : "signOutClicked"
      "change @ui.input"  : "inputChanged"

    triggers:
      "click @ui.addProject" : "add:project:clicked"

    signOutClicked: (e) ->
      @trigger "sign:out:clicked"

    onRender: ->
      @ui.signout.dropdown()