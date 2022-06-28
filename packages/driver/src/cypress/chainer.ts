import _ from 'lodash'
import $stackUtils from './stack_utils'

export class $Chainer {
  specWindow: Window
  chainerId: string
  firstCall: boolean

  constructor (specWindow) {
    this.specWindow = specWindow
    // The id prefix needs to be unique per origin, so there are not
    // collisions when chainers created in a secondary origin are passed
    // to the primary origin for the command log, etc.
    this.chainerId = _.uniqueId(`ch-${window.location.origin}-`)

    // firstCall is used to throw a useful error if the user leads off with a
    // parent command.

    // TODO: Refactor firstCall out of the chainer and into the command function,
    // since cy.ts already has all the necessary information to throw this error
    // without an instance variable, in one localized place in the code.
    this.firstCall = true
  }

  static remove (key) {
    delete $Chainer.prototype[key]
  }

  static add (key, fn) {
    $Chainer.prototype[key] = function (...args) {
      const userInvocationStack = $stackUtils.normalizedUserInvocationStack(
        (new this.specWindow.Error('command invocation stack')).stack,
      )

      // call back the original function with our new args
      // pass args an as array and not a destructured invocation
      fn(this, userInvocationStack, args)

      // return the chainer so additional calls
      // are slurped up by the chainer instead of cy
      return this
    }
  }
}
