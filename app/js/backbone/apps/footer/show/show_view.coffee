@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "footer/show/layout"

  class Show.Update extends App.Views.ItemView
    template: "footer/show/_update"

    triggers:
      "click [data-js='download-update']" : "download:update:clicked"

    modelEvents:
      "change:updatesAvailable" : "render"

    onRender: ->
      $("html").toggleClass("has-updates", @model.get("updatesAvailable"))

    onDestroy: ->
      $("html").removeClass("has-updates")

  class Show.Bottom extends App.Views.ItemView
    template: "footer/show/_bottom"

    ui:
      settings:    "[data-js='options']"
      cog:         ".fa-cog"
      quit:        "[data-quit]"
      updates:     "[data-updates]"
      debug:       "[data-debug]"
      tests:       "[data-tests]"
      about:       "[data-about]"
      preferences: "[data-preferences]"

    triggers:
      "click @ui.quit"        : "quit:clicked"
      "click @ui.settings"    : "settings:clicked"
      "click @ui.updates"     : "updates:clicked"
      "click @ui.debug"       : "debug:clicked"
      "click @ui.tests"       : "tests:clicked"
      "click @ui.about"       : "about:clicked"
      "click @ui.preferences" : "preferences:clicked"

    events:
      "click .dropdown-menu a" : "aClicked"

    onRender: ->
      @ui.cog.dropdown()

    onShow: ->
      @ui.settings.tooltip
        title: "Options"
        placement: "left"

    aClicked: ->
      @ui.cog.dropdown("toggle")

    onDestroy: ->
      @ui.settings.tooltip("destroy")