const util = require('../util')
const state = require('../tasks/state')

const getVersions = () => {
  return state.getBinaryPkgVersionAsync()
  .then((binaryVersion) => {
    return {
      package: util.pkgVersion(),
      binary: binaryVersion || 'not installed',
    }
  })
}

module.exports = {
  getVersions,
}
