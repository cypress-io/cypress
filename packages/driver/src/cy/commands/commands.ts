import _ from 'lodash'

import { $Chainer } from '../../cypress/chainer'
import $errUtils from '../../cypress/error_utils'

const command = function (ctx, name, ...args) {
  if (!ctx[name]) {
    const cmds = `\`${_.keys($Chainer.prototype).join('`, `')}\``

    $errUtils.throwErrByPath('miscellaneous.invalid_command', {
      args: { name, cmds },
    })
  }

  return ctx[name].apply(ctx, args)
}

export default function (Commands, Cypress, cy) {
  Commands.addChainer({
    // userInvocationStack has to be passed in here, but can be ignored
    command (chainer, userInvocationStack, name, args) {
      return command(chainer, name, ...args)
    },
  })

  Commands.addAllSync({
    command (...args) {
      args.unshift(cy)

      // casted to `any` to ignore ts error.
      return command.apply(window, args as any)
    },
  })
}
