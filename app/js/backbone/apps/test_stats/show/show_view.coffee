@App.module "TestStatsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Stats extends App.Views.ItemView
    template: "test_stats/show/stats"

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