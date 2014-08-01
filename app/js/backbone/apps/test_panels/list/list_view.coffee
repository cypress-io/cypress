@App.module "TestPanelsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Panel extends App.Views.ItemView
    template: "test_panels/list/_panel"

    events:
      "click" : "clicked"

    modelEvents:
      "change:chosen" : "chosenChanged"

    clicked: (e) ->
      e.preventDefault()
      @model.toggleChoose()

    chosenChanged: (model, value, options) ->
      @$el.toggleClass("active", value)

  class List.Panels extends App.Views.CollectionView
    tagName: "ul"
    id: "ecl-test-panels"
    className: "ecl-vnavigation"
    childView: List.Panel
