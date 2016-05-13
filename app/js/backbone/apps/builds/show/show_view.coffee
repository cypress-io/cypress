@App.module "BuildsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "builds/show/show_layout"