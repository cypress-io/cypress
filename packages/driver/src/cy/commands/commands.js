const _ = require('lodash')

const $Chainer = require('../../cypress/chainer')
const $errUtils = require('../../cypress/error_utils')

const command = function (ctx, name, ...args) {
  if (!ctx[name]) {
    const cmds = `\`${_.keys($Chainer.prototype).join('`, `')}\``

    $errUtils.throwErrByPath('miscellaneous.invalid_command', {
      args: { name, cmds },
    })
  }

  return ctx[name].apply(ctx, args)
}

module.exports = function (Commands, Cypress, cy) {
  Commands.addChainer({
    // userInvocationStack has to be passed in here, but can be ignored
    command (chainer, userInvocationStack, args) {
      return command(chainer, ...args)
    },
  })

  Commands.addAllSync({
    command (...args) {
      args.unshift(cy)

      return command.apply(window, args)
    },
  })
}
