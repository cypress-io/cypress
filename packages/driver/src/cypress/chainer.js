const _ = require('lodash')
const $stackUtils = require('./stack_utils')

class $Chainer {
  constructor (userInvocationStack, specWindow) {
    this.userInvocationStack = userInvocationStack
    this.specWindow = specWindow
    this.chainerId = _.uniqueId('chainer')
    this.firstCall = true
  }

  static remove (key) {
    delete $Chainer.prototype[key]
  }

  static add (key, fn) {
    $Chainer.prototype[key] = function (...args) {
      const userInvocationStack = this.useInitialStack
        ? this.userInvocationStack
        : $stackUtils.normalizedUserInvocationStack(
          (new this.specWindow.Error('command invocation stack')).stack,
        )

      // call back the original function with our new args
      // pass args an as array and not a destructured invocation
      if (fn(this, userInvocationStack, args)) {
        // no longer the first call
        this.firstCall = false
      }

      // return the chainer so additional calls
      // are slurped up by the chainer instead of cy
      return this
    }
  }

  // creates a new chainer instance
  static create (key, userInvocationStack, specWindow, args) {
    const chainer = new $Chainer(userInvocationStack, specWindow)

    // this is the first command chained off of cy, so we use
    // the stack passed in from that call instead of the stack
    // from this invocation
    chainer.useInitialStack = true

    // since this is the first function invocation
    // we need to pass through onto our instance methods
    const chain = chainer[key].apply(chainer, args)

    chain.useInitialStack = false

    return chain
  }
}

module.exports = $Chainer
