/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const os = require('os')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))

const getOsVersion = () => {
  return Promise.try(() => {
    if (os.platform() === 'linux') {
      return getos()
      .then((obj) => {
        return [obj.dist, obj.release].join(' - ')
      }).catch((err) => {
        return os.release()
      })
    }

    return os.release()

  })
}


module.exports = {
  info () {
    return getOsVersion()
    .then((osVersion) => {
      return {
        osName: os.platform(),
        osVersion,
        osCpus: os.cpus(),
        osMemory: {
          free: os.freemem(),
          total: os.totalmem(),
        },
      }
    })
  },
}
