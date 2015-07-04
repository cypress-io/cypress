@App.module "AboutApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.About extends App.Views.ItemView
    template: "about/show/_about"

    ui:
      "button" : "button"
      "page"   : "[data-page]"

    triggers:
      "click @ui.button"    : "button:clicked"
      "click @ui.page"      : "page:clicked"