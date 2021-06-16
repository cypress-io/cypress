const $Location = require('../cypress/location')
const $utils = require('../cypress/utils')

const create = (state) => {
  return {
    getRemoteLocation (key, win) {
      try {
        const remoteUrl = $utils.locToString(win ?? state('window'))
        const location = $Location.create(remoteUrl)

        if (key) {
          return location[key]
        }

        return location
      } catch (e) {
        // it is possible we do not have access to the location
        // for example, if the app has redirected to a 2nd domain
        return ''
      }
    },
  }
}

module.exports = {
  create,
}
