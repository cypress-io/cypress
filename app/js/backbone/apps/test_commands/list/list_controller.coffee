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

      ## revert rules
      ##
      ## 1. when we hover over a command, wait 50 ms
      ## if we're still hovering, revert the dom
      ##
      ## 2. when we hover off a command, wait 50 ms
      ## and if we are still in a non 'reverting' state
      ## meaning we have moused over nothing instead
      ## of a different command, then restore the dom
      ## to the original
      ##
      ## this prevents heavy CPU usage when hovering
      ## up and down over commands. it also prevents
      ## restoring to the original through all of that.
      ## additionally when quickly moving your mouse
      ## over many commands, unless you're hovered for
      ## 50ms, it wont revert at all. so we optimize
      ## for both reverting + restoring

      revert = (command, init) =>
        if init
          ## we are attemping to revert
          @reverting = true

          @listenToOnce command, "revert:dom", ->
            ## we are now in a reverted state
            ## from the original
            @reverted = true
            App.config.revertDom(command)

          Promise.delay(50).then ->
            command.trigger "revert:dom"

        else
          ## we are no longer attemping to revert
          @reverting = false
          @stopListening command

          Promise.delay(50).then =>
            ## if we are currently reverted but
            ## we arent re-reverting to a differnent state
            if @reverted and not @reverting
              ## set reverted back to false
              ## since we're no longer reverted (we are restored)
              @reverted = false

              ## and restore the dom to the original state
              App.config.revertDom(command, false)

      @listenTo commandsView, "childview:childview:command:mouseenter", (iv, iv2, args) ->
        command = args.model
        # return @highlightClone(hooks, command) if command.isCloned()

        revert command, true

      @listenTo commandsView, "childview:childview:command:mouseleave", (iv, iv2, args) ->
        command = args.model
        # return @highlightClone(hooks, command, false) if command.isCloned()

        revert command, false

      @show commandsView

    onDestroy: ->
      @hooks.reset([], {silent: true})

    highlightClone: (hooks, command, init) ->
      hooks.getOriginalCommandByClone(command).highlight(init)

    getCommandsView: (hooks) ->
      new List.Hooks
        collection: hooks