@App.module "TestAgentsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Agent extends App.Views.ItemView
    template: "test_agents/list/_agent"

    modelEvents:
      "change:callCount" : "render"

  class List.Agents extends App.Views.CompositeView
    template: "test_agents/list/agents"
    childView: List.Agent
    childViewContainer: "tbody"

    className: "instruments-container"

    collectionEvents:
      "add" : "updateTotal"

    ## TODO: refactor all of this into a behavior!

    ui:
      total:     "[data-js='total']"
      container: ".agents-container"
      hook:      ".hook-name"
      caret:     "i.fa-caret-right"
      ellipsis:  "i.fa-ellipsis-h"

    events:
      "click @ui.hook" : "hideOrShow"
      "click"          : "stopProp"
      "mouseover"      : "stopProp"
      "mouseout"       : "stopProp"

    changeIconDirection: (bool) ->
      klass = if bool then "right" else "down"
      @ui.caret.removeClass().addClass("fa fa-caret-#{klass}")

    displayEllipsis: (bool) ->
      @ui.ellipsis.toggleClass "hidden", bool

    hideOrShow: (e) ->
      hidden = @ui.container.is(":hidden")

      @changeIconDirection(!hidden)
      @displayEllipsis(hidden)

      if hidden
        @ui.container.removeClass("hidden")
      else
        @ui.container.addClass("hidden")

      e.stopPropagation()

    updateTotal: ->
      @ui.total.text @collection.length

      method = if @collection.length then "show" else "hide"
      @$el[method]()

    onShow: ->
      @updateTotal()
