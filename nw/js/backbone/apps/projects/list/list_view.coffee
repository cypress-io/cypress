@App.module "ProjectsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Project extends App.Views.ItemView
    template: "projects/list/_project"

    triggers:
      "click" : "project:clicked"

  class List.Projects extends App.Views.CompositeView
    template: "projects/list/projects"
    childView: List.Project
    childViewContainer: "ul"

    ui:
      "button" : "button"
      "input"  : "input"

    events:
      "click @ui.button" : "buttonClicked"
      "change @ui.input" : "inputChanged"

    buttonClicked: (e) ->
      App.fileDialogOpened = true
      @ui.input.click()

    inputChanged: (e) ->
      App.fileDialogOpened = null
      @trigger "project:added", @ui.input.val()