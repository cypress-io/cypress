@App.module "UpdatesAppliedApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.UpdatesApplied extends App.Views.ItemView
    template: "updates_applied/show/_updates_applied"