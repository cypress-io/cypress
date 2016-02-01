@App.module "AboutApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.About extends App.Views.ItemView
    template: "about/show/_about"

    ui:
      "page"   : "[data-page]"

    triggers:
      "click @ui.page"      : "page:clicked"

    templateHelpers: ->
      {
        src: @options.src
      }