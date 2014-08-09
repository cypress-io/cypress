@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Command extends App.Views.ItemView
    template: "test_commands/list/command"

  class List.Commands extends App.Views.CollectionView
    tagName: "ul"
    childView: List.Command
