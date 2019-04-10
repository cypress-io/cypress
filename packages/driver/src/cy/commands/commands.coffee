_ = require("lodash")

$utils = require("../../cypress/utils")


module.exports = (Commands, Cypress, cy, state, config) ->
  command = (ctx, name, args...) ->
    if not ctx[name]
      cmds = _.keys(cy.getChainer().prototype).join(", ")
      $utils.throwErrByPath("miscellaneous.invalid_command", {
        args: { name, cmds }
      })

    ctx[name].apply(null, args)

  Commands.addChainer({
    command: (chainer, args) ->
      command(chainer, args...)
  })

  Commands.addAllSync({
    command: (args...) ->
      args.unshift(cy)

      command.apply(null, args)
  })
