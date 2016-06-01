@App.module "AutomationApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "automation/show/layout"

    triggers:
      "click button" : "reload:button:clicked"