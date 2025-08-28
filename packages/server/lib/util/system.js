const os = require('os')
const Promise = require('bluebird')
const si = require('systeminformation')

const getOsVersion = () => {
  return Promise.try(() => {
    return si.osInfo()
    .then((osInfo) => {
      if (osInfo.distro && osInfo.release) {
        return `${osInfo.distro} - ${osInfo.release}`
      }

      return os.release()
    }).catch(() => {
      return os.release()
    })
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
