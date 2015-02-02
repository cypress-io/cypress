@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Footer extends App.Views.ItemView
    template: "footer/show/footer"

    ui:
      reload:   ".fa-repeat"
      console:  ".fa-terminal"
      settings: ".fa-cog"
      quit:     "[data-quit]"

    triggers:
      "click @ui.quit"     : "quit:clicked"
      "click @ui.reload"   : "reload:clicked"
      "click @ui.console"  : "console:clicked"
      "click @ui.settings" : "settings:clicked"

    onRender: ->
      @ui.settings.dropdown()
