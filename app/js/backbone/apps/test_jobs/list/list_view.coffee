@App.module "TestJobsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Job extends App.Views.ItemView
    template: "test_jobs/list/_job"

    ui:
      state:      ".job-state"
      stateIcon:  ".job-state-container i"

    modelEvents:
      "change:state": "render"
      "change:id"   : "render"

    onRender: ->
      @$el.removeClass().addClass @getClassByState()

    getClassByState: ->
      switch @model.get("state")
        when "passed" then "success"
        when "failed" then "danger"
        when "error"  then "warning"
        else ""

  class List.Loading extends App.Views.ItemView
    template: "test_jobs/list/_loading"

  class List.Jobs extends App.Views.CompositeView
    template: "test_jobs/list/jobs"
    childView: List.Job
    emptyView: List.Loading
    childViewContainer: "tbody"

    ui:
      container: "#test-jobs"

    onShow: ->
      ## This is pretty much straight up duplicated from the iframe's
      ## show.  Either figure out a better way to do dynamic width
      ## control or refactor this into a reusable view concern / behavior
      ## or just a straight up app utility.  right now i would suggest
      ## a behavior
      main      = $("#main-region :first-child")
      tests     = $("#test-container")

      view = @

      @calcWidth = _(@calcWidth).partial main, tests, @ui.container

      $(window).on "resize", @calcWidth

      @calcWidth()

    templateHelpers: ->
      jobName: @options.jobName

    onDestroy: ->
      $(window).off "resize", @calcWidth

    calcWidth: (main, tests, container) ->
      _.defer ->
        container.width main.width() - tests.width()