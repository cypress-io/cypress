const _ = require('lodash')

class $Chainer {
  constructor () {
    this.chainerId = _.uniqueId('chainer')
    this.firstCall = true
  }

  static remove (key) {
    delete $Chainer.prototype[key]
  }

  static add (key, fn) {
    $Chainer.prototype[key] = function (...args) {
      // call back the original function with our new args
      // pass args an as array and not a destructured invocation
      if (fn(this, args)) {
        // no longer the first call
        this.firstCall = false
      }

      // return the chainer so additional calls
      // are slurped up by the chainer instead of cy
      return this
    }
  }

  // creates a new chainer instance
  static create (key, args) {
    const chainer = new $Chainer()

    // since this is the first function invocation
    // we need to pass through onto our instance methods
    return chainer[key].apply(chainer, args)
  }
}

module.exports = $Chainer
