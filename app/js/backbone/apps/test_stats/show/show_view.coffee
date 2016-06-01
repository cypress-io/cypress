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

    ## this view is a good candidate for stick it

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

  class Show.Config extends App.Views.ItemView
    template: "test_stats/show/_config"

    ui:
      stop:    "[data-js-stop]"
      restart: "[data-js-restart]"
      play:   "[data-js-play]"
      next:   "[data-js-next]"
      tooltips: "[data-toggle='tooltip']"

    modelEvents:
      "pause:mode":          "render"
      "change:running":      "render"
      "change:ended":        "render"
      "change:disableStop":  "disableStopChanged"
      "change:disableNext":  "disableNextChanged"

    events:
      "click a" : "aClicked"

    triggers:
      "click @ui.stop"   : "stop:clicked"
      "click @ui.restart": "restart:clicked"
      "click @ui.play"   : "play:clicked"
      "click @ui.next"   : "next:clicked"

    onBeforeRender: ->
      if _.isObject(@ui.tooltips) and @ui.tooltips.length
        @ui.tooltips.tooltip("destroy")

    onRender: ->
      @ui.tooltips.tooltip({container: "body", placement: "bottom"})

    onDestroy: ->
      @ui.tooltips.tooltip("destroy")

    disableStopChanged: (model, value, options) ->
      return if value isnt true

      @ui.stop.addClass("disabled").attr("disabled", true)

    disableNextChanged: (model, value, options) ->
      return if value isnt true

      @ui.next.addClass("disabled").attr("disabled", true)

    aClicked: (e) ->
      e.preventDefault()
      js = $(e.target).data("js")
      # @trigger "clicked:#{js}"
