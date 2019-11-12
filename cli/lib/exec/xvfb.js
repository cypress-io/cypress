const Promise = require('bluebird')
const Xvfb = require('@cypress/xvfb')
const debug = require('debug')('cypress:cli')
const debugXvfb = require('debug')('cypress:xvfb')
const { throwFormErrorText, errors } = require('../errors')

const xvfb = Promise.promisifyAll(new Xvfb({
  timeout: 30000, // milliseconds
  onStderrData (data) {
    if (debugXvfb.enabled) {
      debugXvfb(data.toString())
    }
  },
}))

module.exports = {
  _debugXvfb: debugXvfb, // expose for testing

  _xvfb: xvfb, // expose for testing

  start () {
    debug('Starting Xvfb')

    return xvfb.startAsync()
    .return(null)
    .catch({ nonZeroExitCode: true }, throwFormErrorText(errors.nonZeroExitCodeXvfb))
    .catch((err) => {
      if (err.known) {
        throw err
      }

      return throwFormErrorText(errors.missingXvfb)(err)
    })
  },

  stop () {
    debug('Stopping Xvfb')

    return xvfb.stopAsync()
    .return(null)
    .catch(() => {
      // noop
    })
  },

  isNeeded () {
    debug('stubbing isNeeded false %o', new Error().stack)

    return false
  },

  // async method, resolved with Boolean
  verify () {
    return xvfb.startAsync()
    .return(true)
    .catch((err) => {
      debug('Could not verify xvfb: %s', err.message)

      return false
    })
    .finally(xvfb.stopAsync)
  },
}
