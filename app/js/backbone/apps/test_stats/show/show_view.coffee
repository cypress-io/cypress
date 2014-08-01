@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "test_stats/show/show_layout"

  class Show.Stats extends App.Views.ItemView
    template: "test_stats/show/_stats"

    ui:
      passed:     "#tests-passed .num"
      failed:     "#tests-failed .num"
      pending:    "#tests-pending .num"
      duration:   "#tests-duration .num"

    modelEvents:
      "change:passed"   : "passedChanged"
      "change:failed"   : "failedChanged"
      "change:pending"  : "pendingChanged"
      "change:duration" : "durationChanged"

    passedChanged: (model, value, options) ->
      @ui.passed.text @count(value)

    failedChanged: (model, value, options) ->
      @ui.failed.text @count(value)

    pendingChanged: (model, value, options) ->
      @ui.pending.text @count(value)

    durationChanged: (model, value, options) ->
      duration = @model.getDurationFormatted()
      @ui.duration.text @count(duration)

    count: (num) ->
      if num > 0 then num else "--"

    templateHelpers: ->
      count: @count

  class Show.Chosen extends App.Views.ItemView
    template: "test_stats/show/_chosen"

    ui:
      length: ".length"
      label: "label"

    triggers:
      "click @ui.label" : "close:clicked"

    initialize: ->
      @listenTo @model.get("children"), "add remove reset", =>
        @ui.length.text @model.get("children").length