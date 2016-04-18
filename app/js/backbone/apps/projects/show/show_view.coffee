@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Project extends App.Views.LayoutView
    template: "projects/show/project"

    ui:
      "hostInfo": "[data-js='host-info']"
      "runBrowser": "[data-js='run-browser']"
      "switchBrowser": "[data-js='switch-browser']"

    modelEvents:
      "rebooted"         : "render"
      "change:clientUrl" : "render"
      "change:error"     : "render"

    triggers:
      "click @ui.hostInfo": "host:info:clicked"
      "click [data-stop]" : "stop:clicked"
      "click [data-ok]"   : "ok:clicked"

    events:
      "click @ui.runBrowser": "runBrowserClicked"
      "click @ui.switchBrowser": "switchBrowserClicked"

    onShow: ->
      $("html").addClass("project-show")

    onDestroy: ->
      $("html").removeClass("project-show")

    templateHelpers: ->
      browsers: @collection.toJSON()

    runBrowserClicked: (e) ->
      btn = $(e.currentTarget)
      browser = btn.data().browser

      @trigger "run:browser:clicked", browser


      @toggleBrowserRunning(btn, true, browser)

    ## need to run toggleBrowserrunning() when browser has stopped

    toggleBrowserRunning: (btn, bool, browser) ->
      icon = if bool then "fa-refresh fa-spin" else "fa-chrome"

      btn
        .toggleClass("disabled", bool)
        .attr("disabled", bool)
        .text (i, text) ->
          if bool
            text.replace("Run", "Running")
          else
            text.replace("Running", "Run")
        .prepend("<i class='fa #{icon}'></i>")
        .parent(".btn-group")
          .find("[data-toggle='dropdown']")
            .toggleClass("disabled", bool)
            .attr("disabled", bool)

    switchBrowserClicked: (e) ->
      browserChosen = $(e.currentTarget)
      browserChosenText = browserChosen.text()
      browserChosenIcon = browserChosen.find("i")

      runBtn = browserChosen.parents(".btn-group").find("[data-js='run-browser']")
      runBtnText = runBtn.text()
      runBtnIcon = runBtn.find("i")

      ## switcheroo the text and icons on the 2 btns
      browserChosen
        .text(runBtnText)
        .prepend(runBtnIcon)
      runBtn
        .text(browserChosenText)
        .prepend(browserChosenIcon)
