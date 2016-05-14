@App.module "DisconnectedApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "disconnected/show/layout"

    triggers:
      "click button" : "reload:button:clicked"