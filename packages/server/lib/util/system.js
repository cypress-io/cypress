const os = require('os')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))

const getOsVersion = () => {
  return Promise.try(() => {
    if (os.platform() === 'linux') {
      return getos()
      .then((obj) => {
        return [obj.dist, obj.release].join(' - ')
      }).catch(() => {
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
