_ = require("lodash")

$utils = require("../../cypress/utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  command = (ctx, name, args...) ->
  if not ctx[name]
    cmds = _.keys($Chainer.prototype).join(", ")
    $utils.throwErrByPath("miscellaneous.invalid_command", {
      args: { name, cmds }
    })

  ctx[name].apply(window, args)

  Commands.addChainer({
    command: (chainer, args) ->
      command(chainer, args...)
  })

  Commands.addAllSync({
    command: (args...) ->
      args.unshift(cy)

      command.apply(window, args)
  })
