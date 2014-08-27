@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Tests extends App.Views.LayoutView
    template: "tests/list/tests"