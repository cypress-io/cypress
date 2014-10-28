@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  ECL_WRAPPER = "#ecl-wrapper"

  class List.Layout extends App.Views.LayoutView
    template: "nav/list/layout"

    satelliteMode: ->
      ## when we enter satellite-mode add this class to our wrapper
      $(ECL_WRAPPER).removeClass().addClass("satellite-mode")

  class List.Nav extends App.Views.ItemView
    template: "nav/list/_nav"
    className: "parent"

    modelEvents:
      "change:chosen" : "chosenChanged"

    chosenChanged: (model, value, options) ->
      @$el.toggleClass "active", value

  class List.Navs extends App.Views.CompositeView
    template: "nav/list/_navs"
    childView: List.Nav
    childViewContainer: "ul"

    ui:
      collapse: "#sidebar-collapse"
      angle: ".collapse-container i"

    events:
      "click @ui.collapse" : "collapseClicked"

    modelEvents:
      "change:collapsed" : "collapsedChanged"

    ## this view is a good candidate for stick it

    onShow: ->
      @collapsedChanged @model, @model.get("collapsed")

    collapseClicked: (e) ->
      ## switch the boolean
      @model.toggleCollapse()

    collapsedChanged: (model, value, options) ->
      ## must go outside of this view to add the collapse class
      ## since it affects both the nav region + main region
      $(ECL_WRAPPER).toggleClass("collapsed", value)

      ## swap the fa angle class
      klass = if value then "fa fa-angle-right" else "fa fa-angle-left"
      @ui.angle.removeClass().addClass klass