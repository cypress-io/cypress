const _ = require('lodash')

class $Chainer {
  constructor (invocationStack, specWindow) {
    this.invocationStack = invocationStack
    this.specWindow = specWindow
    this.chainerId = _.uniqueId('chainer')
    this.firstCall = true
  }

  static remove (key) {
    delete $Chainer.prototype[key]
  }

  static add (key, fn) {
    $Chainer.prototype[key] = function (...args) {
      const invocationStack = this.useInitialStack
        ? this.invocationStack
        : this.specWindow.__getSpecFrameStack('chained command invocation stack')

      // call back the original function with our new args
      // pass args an as array and not a destructured invocation
      if (fn(this, invocationStack, args)) {
        // no longer the first call
        this.firstCall = false
      }

      // return the chainer so additional calls
      // are slurped up by the chainer instead of cy
      return this
    }
  }

  // creates a new chainer instance
  static create (key, invocationStack, specWindow, args) {
    const chainer = new $Chainer(invocationStack, specWindow)

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
