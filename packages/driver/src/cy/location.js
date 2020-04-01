const $Location = require('../cypress/location')
const $utils = require('../cypress/utils')

const create = (state) => {
  return {
    getRemoteLocation (key, win) {
      try {
        const remoteUrl = $utils.locToString(win != null ? win : state('window'))
        const location = $Location.create(remoteUrl)

        if (key) {
          return location[key]
        }

        return location
      } catch (e) {
        return ''
      }
    },
  }
}

module.exports = {
  create,
}
