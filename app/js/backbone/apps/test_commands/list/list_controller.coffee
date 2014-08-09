@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { commands } = options

      commandsView = @getCommandsView commands

      @show commandsView

    getCommandsView: (commands) ->
      new List.Commands
        collection: commands