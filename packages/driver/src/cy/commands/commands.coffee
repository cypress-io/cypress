_ = require("lodash")

$Chainer = require("../../cypress/chainer")
$utils = require("../../cypress/utils")

command = (ctx, name, args...) ->
  if not ctx[name]
    cmds = _.keys($Chainer.prototype).join(", ")
    $utils.throwErrByPath("miscellaneous.invalid_command", {
      args: { name, cmds }
    })

  ctx[name].apply(window, args)

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addChainer({
    command: (chainer, args) ->
      command(chainer, args...)
  })

  Commands.addAllSync({
    command: (args...) ->
      args.unshift(cy)

      command.apply(window, args)
  })
