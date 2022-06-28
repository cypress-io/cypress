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
  $Chainer.add('command', function (chainer, userInvocationStack, args) {
    // `...args` below is the shorthand of `args[0], ...args.slice(1)`
    // TypeScript doesn't allow this.
    // @ts-ignore
    return command(chainer, ...args)
  })

  Commands.addAllSync({
    command (...args) {
      args.unshift(cy)

      // cast to `any` to ignore ts error.
      return command.apply(window, args as any)
    },
  })
}
