const os = require('os')
const Promise = require('bluebird')
const Xvfb = require('@cypress/xvfb')
const R = require('ramda')
const debug = require('debug')('cypress:cli')
const debugXvfb = require('debug')('cypress:xvfb')
const { throwFormErrorText, errors } = require('../errors')

const xvfb = Promise.promisifyAll(new Xvfb({
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
    debug('Starting XVFB')
    return xvfb.startAsync()
    .catch(throwFormErrorText(errors.missingXvfb))
  },

  stop () {
    debug('Stopping XVFB')
    return xvfb.stopAsync()
  },

  isNeeded () {
    return os.platform() === 'linux' && !process.env.DISPLAY
  },

  // async method, resolved with Boolean
  verify () {
    return xvfb.startAsync()
    .then(R.T)
    .catch((err) => {
      debug('Could not verify xvfb: %s', err.message)
      return false
    })
    .finally(xvfb.stopAsync)
  },
}
