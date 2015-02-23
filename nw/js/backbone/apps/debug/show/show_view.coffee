@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Debug extends App.Views.ItemView
    template: "debug/show/debug"