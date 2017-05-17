const os = require('os')
const Promise = require('bluebird')
const Xvfb = require('xvfb')

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
}
