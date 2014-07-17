@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Test extends App.Views.ItemView
    template: "tests/show/test"