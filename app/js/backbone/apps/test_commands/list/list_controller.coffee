@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { hooks, runner } = options

      commandsView = @getCommandsView hooks

      @listenTo commandsView, "childview:childview:revert:clicked", (iv, iv2, args) ->
        command = args.model
        command.choose()
        runner.revertDom(command)

      @listenTo commandsView, "childview:childview:command:mouseenter", (iv, iv2, args) ->
        command = args.model
        return @highlightClone(commands, command) if command.isCloned()

        return if not command.getEl()
        runner.highlightEl(command)

      @listenTo commandsView, "childview:childview:command:mouseleave", (iv, iv2, args) ->
        command = args.model
        return @highlightClone(commands, command, false) if command.isCloned()

        return if not command.getEl()
        runner.highlightEl(command, false)

      @show commandsView

    highlightClone: (commands, command, init) ->
      commands.getOriginalByClone(command).highlight(init)

    getCommandsView: (hooks) ->
      new List.Hooks
        collection: hooks