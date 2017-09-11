const util = require('../util')
const info = require('../tasks/info')

const getVersions = () => {
  return info.getInstalledVersion()
  .then((binary) => {
    return {
      package: util.pkgVersion(),
      binary: binary || 'not installed',
    }
  })
}

module.exports = {
  getVersions,
}
