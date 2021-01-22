const util = require('../util')
const errors = require('../../errors')

const ARRAY_METHODS = ['concat', 'push', 'unshift', 'slice', 'pop', 'shift', 'slice', 'splice', 'filter', 'map', 'forEach', 'reduce', 'reverse', 'splice', 'includes']

module.exports = {
  wrap (ipc, invoke, ids, args) {
    // TODO: remove in next breaking release
    // This will send a warning message when a deprecated API is used
    // define array-like functions on this object so we can warn about using deprecated array API
    // while still fufiling desired behavior
    const [, launchOptions] = args

    let hasEmittedWarning = false

    ARRAY_METHODS.forEach((name) => {
      const boundFn = launchOptions.args[name].bind(launchOptions.args)

      launchOptions[name] = function () {
        if (hasEmittedWarning) return

        hasEmittedWarning = true

        const warning = errors.get('DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS')

        ipc.send('warning', util.serializeError(warning))

        // eslint-disable-next-line prefer-rest-params
        return boundFn.apply(this, arguments)
      }
    })

    Object.defineProperty(launchOptions, 'length', {
      get () {
        return this.args.length
      },
    })

    launchOptions[Symbol.iterator] = launchOptions.args[Symbol.iterator].bind(launchOptions.args)

    util.wrapChildPromise(ipc, invoke, ids, args)
  },
}
