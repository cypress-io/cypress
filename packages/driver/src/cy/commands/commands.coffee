_ = require("lodash")

$Chainer = require("../../cypress/chainer")
$utils = require("../../cypress/utils")

command = (name, args...) ->
  ## continue chaining or call off cy
  ctx = @state("chain") ? @

  if not ctx[name]?
    cmds = _.keys($Chainer.prototype).join(", ")
    $utils.throwErrByPath("miscellaneous.invalid_command", {
      args: { name, cmds }
    })

  ctx[name].apply(ctx, args)

module.exports = (Commands, Cypress, cy, state, config) ->
  ## here we are extending both the Cy prototype
  ## and the Chainer prototype to allow 'cmd' and 'command'
  ## as chainable methods. However these avoid the inject
  ## problem thus avoiding being queue'd as commands. instead
  ## we simply evaluate them and whatever command they are trying
  ## to call, we push onto the command queue. perfect
  # ["cmd", "command"].forEach (key) ->
  #   $Chainer.inject key, (chainerId, firstCall, args) ->
  #     command.apply(@, args)

      # $Chainer.inject key, (chainerId, firstCall, args) ->
      #   @enqueue(key, wrap.call(@, fn, firstCall), args, type, chainerId)

  return {
    cmd: ->
      command.apply(@, arguments)

    command: ->
      command.apply(@, arguments)
  }
