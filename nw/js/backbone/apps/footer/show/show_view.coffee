@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "footer/show/layout"

  class Show.Update extends App.Views.ItemView
    template: "footer/show/_update"

    triggers:
      "click strong" : "strong:clicked"

    modelEvents:
      "change:updatesAvailable" : "render"

  class Show.Bottom extends App.Views.ItemView
    template: "footer/show/_bottom"

    ui:
      reload:   ".fa-repeat"
      console:  ".fa-terminal"
      settings: ".fa-cog"
      quit:     "[data-quit]"
      updates:  "[data-updates]"
      debug:    "[data-debug]"
      about:    "[data-about]"

    triggers:
      "click @ui.quit"     : "quit:clicked"
      "click @ui.reload"   : "reload:clicked"
      "click @ui.console"  : "console:clicked"
      "click @ui.settings" : "settings:clicked"
      "click @ui.updates"  : "updates:clicked"
      "click @ui.debug"    : "debug:clicked"
      "click @ui.about"    : "about:clicked"

    events:
      "click .dropdown-menu a" : "aClicked"

    onRender: ->
      @ui.settings.dropdown()

    aClicked: ->
      @ui.settings.dropdown("toggle")
