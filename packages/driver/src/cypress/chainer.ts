import $stackUtils from './stack_utils'

let idCounter = 1

export class $Chainer {
  specWindow: Window
  chainerId: string

  constructor (specWindow) {
    this.specWindow = specWindow
    // The id prefix needs to be unique per origin, so there are not
    // collisions when chainers created in a secondary origin are passed
    // to the primary origin for the command log, etc.
    this.chainerId = `ch-${window.location.origin}-${idCounter++}`
  }

  static remove (key) {
    delete $Chainer.prototype[key]
  }

  static add (key, fn) {
    $Chainer.prototype[key] = function (...args) {
      const privilegeVerification = Cypress.emitMap('command:invocation', { name: key, args })

      const userInvocationStack = $stackUtils.normalizedUserInvocationStack(
        (new this.specWindow.Error('command invocation stack')).stack,
      )

      // call back the original function with our new args
      // pass args an as array and not a destructured invocation
      fn(this, userInvocationStack, args, privilegeVerification)

      // return the chainer so additional calls
      // are slurped up by the chainer instead of cy
      return this
    }
  }
}
