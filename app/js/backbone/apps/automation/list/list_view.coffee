@App.module "AutomationApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Layout extends App.Views.ItemView
    template: "automation/list/layout"

    ui:
      "runBrowser":  "[data-js='run-browser']"

    events:
      "click @ui.runBrowser": "runBrowserClicked"

    templateHelpers: ->
      browsers: @collection.toJSON()

    runBrowserClicked: (e) ->
      e.stopPropagation()
      e.preventDefault()

      btn = $(e.currentTarget)
      browser = btn.data("browser")

      @trigger "run:browser:clicked", browser