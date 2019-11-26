const _ = require('lodash')
const debug = require('debug')('cypress:server:buffers')
const uri = require('./uri')

let buffer = null

const stripPort = (url) => {
  try {
    return uri.removeDefaultPort(url).format()
  } catch (e) {
    return url
  }
}

module.exports = {
  getAny () {
    return buffer
  },

  reset () {
    debug('resetting buffers')

    buffer = null
  },

  set (obj = {}) {
    obj = _.cloneDeep(obj)
    obj.url = stripPort(obj.url)
    obj.originalUrl = stripPort(obj.originalUrl)

    if (buffer) {
      debug('warning: overwriting existing buffer...', { buffer: _.pick(buffer, 'url') })
    }

    debug('setting buffer %o', _.pick(obj, 'url'))

    buffer = obj
  },

  get (str) {
    if (buffer && buffer.url === stripPort(str)) {
      return buffer
    }
  },

  take (str) {
    const foundBuffer = this.get(str)

    if (foundBuffer) {
      buffer = null

      debug('found request buffer %o', { buffer: _.pick(foundBuffer, 'url') })

      return foundBuffer
    }
  },

}
