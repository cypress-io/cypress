@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Project extends App.Views.LayoutView
    template: "projects/show/project"

    ui:
      "hostInfo": "[data-js='host-info']"
      "runBrowser": "[data-js='run-browser']"
      "switchBrowser": "[data-js='switch-browser']"
      "browserIcon": "[data-js='browser-icon']"
      "browserText": "[data-js='browser-text']"

    modelEvents:
      "rebooted"            : "render"
      "change:clientUrl"    : "render"
      "change:error"        : "render"
      "change:browserState" : "browserStateChanged"

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

    getIconClass: (state) ->
      switch state
        when "opening" then "fa-refresh fa-spin"
        when "opened"  then "fa-check-circle"
        when "closed"  then "fa-chrome"

    browserStateChanged: (model, value, options) ->
      browser   = @model.get("browser")
      clickable = @model.get("browserClickable")

      icon = @getIconClass(value)

      @ui.browserIcon.removeClass().addClass("fa #{icon}")

      @ui.browserText.text(@model.get("browserText"))

      @ui.runBrowser
        .toggleClass("disabled", !clickable)
        .attr("disabled", !clickable)
        .parent(".btn-group")
          .find("[data-toggle='dropdown']")
            .toggleClass("disabled", !clickable)
            .attr("disabled", !clickable)

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
