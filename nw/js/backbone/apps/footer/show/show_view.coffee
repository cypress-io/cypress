@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "footer/show/layout"

  class Show.Update extends App.Views.ItemView
    template: "footer/show/_update"

  class Show.Bottom extends App.Views.ItemView
    template: "footer/show/_bottom"

    ui:
      reload:   ".fa-repeat"
      console:  ".fa-terminal"
      settings: ".fa-cog"
      quit:     "[data-quit]"
      updates:  "[data-updates]"

    triggers:
      "click @ui.quit"     : "quit:clicked"
      "click @ui.reload"   : "reload:clicked"
      "click @ui.console"  : "console:clicked"
      "click @ui.settings" : "settings:clicked"
      "click @ui.updates"  : "updates:clicked"

    onRender: ->
      @ui.settings.dropdown()
