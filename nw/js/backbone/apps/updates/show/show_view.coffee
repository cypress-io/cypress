@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Updates extends App.Views.ItemView
    template: "updates/show/updates"