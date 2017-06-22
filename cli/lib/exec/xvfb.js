const os = require('os')
const Promise = require('bluebird')
const Xvfb = require('@cypress/xvfb')
const R = require('ramda')
const debug = require('debug')('cypress:cli')

const xvfb = Promise.promisifyAll(new Xvfb({ silent: true }))

module.exports = {
  start () {
    return xvfb.startAsync()
  },

  stop () {
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
