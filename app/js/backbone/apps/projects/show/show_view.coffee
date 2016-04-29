@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Project extends App.Views.LayoutView
    template: "projects/show/project"

    ui:
      "hostInfo": "[data-js='host-info']"
      "runBrowser": "[data-js='run-browser']"
      "browserIcon": "[data-js='browser-icon']"
      "browserText": "[data-js='browser-text']"

    modelEvents:
      "rebooted"            : "render"
      "opened"              : "render"
      "change:error"        : "render"
      "change:browser"      : "render"
      "change:browserState" : "browserStateChanged"

    triggers:
      "click @ui.hostInfo": "host:info:clicked"
      "click [data-stop]" : "stop:clicked"
      "click [data-ok]"   : "ok:clicked"

    events:
      "click @ui.runBrowser": "runBrowserClicked"

    onShow: ->
      $("html").addClass("project-show")

    onDestroy: ->
      $("html").removeClass("project-show")

    templateHelpers: ->
      browsers: @model.displayBrowsers()

    runBrowserClicked: (e) ->
      btn = $(e.currentTarget)
      browser = btn.data().browser

      @trigger "run:browser:clicked", browser

    browserStateChanged: (model, value, options) ->
      clickable = @model.get("browserClickable")

      icon = @model.get("browserIcon")

      @ui.browserIcon.removeClass().addClass("fa #{icon}")

      @ui.browserText.text(@model.get("browserText"))

      @ui.runBrowser
        .toggleClass("disabled", !clickable)
        .attr("disabled", !clickable)
        .parent(".btn-group")
          .find("[data-toggle='dropdown']")
            .toggleClass("disabled", !clickable)
            .attr("disabled", !clickable)
