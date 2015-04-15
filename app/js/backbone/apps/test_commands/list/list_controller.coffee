@App.module "TestCommandsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { test } = options

      @hooks = hooks = test.get("hooks")

      ## when our test is done (when it has a duration defined)
      ## we check to see if we didnt add
      ## any commands, and if not we render
      ## our empty view
      @listenTo test, "change:duration", (model, value, options) ->
        if value? and not hooks.length
          commandsView.renderEmpty = true
          commandsView.render()

      commandsView = @getCommandsView hooks

      @listenTo commandsView, "childview:childview:command:mouseenter", (iv, iv2, args) ->
        command = args.model
        # return @highlightClone(hooks, command) if command.isCloned()

        App.config.revertDom(command)

      @listenTo commandsView, "childview:childview:command:mouseleave", (iv, iv2, args) ->
        command = args.model
        # return @highlightClone(hooks, command, false) if command.isCloned()

        App.config.revertDom(command, false)

      @show commandsView

    onDestroy: ->
      @hooks.reset([], {silent: true})

    highlightClone: (hooks, command, init) ->
      hooks.getOriginalCommandByClone(command).highlight(init)

    getCommandsView: (hooks) ->
      new List.Hooks
        collection: hooks