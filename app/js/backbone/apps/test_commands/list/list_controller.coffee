@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { commands } = options

      commandsView = @getCommandsView commands

      @listenTo commandsView, "childview:pause:clicked", (iv, args) ->
        console.warn args

      @show commandsView

    getCommandsView: (commands) ->
      new List.Commands
        collection: commands