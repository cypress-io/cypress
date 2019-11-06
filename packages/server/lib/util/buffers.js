const _ = require('lodash')
const debug = require('debug')('cypress:server:buffers')
const uri = require('./uri')

let buffers = []

const stripPort = (url) => {
  try {
    return uri.removeDefaultPort(url).format()
  } catch (e) {
    return url
  }
}

module.exports = {
  all () {
    return buffers
  },

  keys () {
    return _.map(buffers, 'url')
  },

  reset () {
    debug('resetting buffers')

    buffers = []
  },

  set (obj = {}) {
    obj.url = stripPort(obj.url)
    obj.originalUrl = stripPort(obj.originalUrl)

    debug('setting buffer %o', _.pick(obj, 'url'))

    return buffers.push(_.pick(obj, 'url', 'originalUrl', 'jar', 'stream', 'response', 'details'))
  },

  getByOriginalUrl (str) {
    const b = _.find(buffers, { originalUrl: stripPort(str) })

    if (b) {
      debug('found request buffer by original url %o', { str, buffer: _.pick(b, 'url', 'originalUrl', 'details'), bufferCount: buffers.length })
    }

    return b
  },

  get (str) {
    return _.find(buffers, { url: stripPort(str) })
  },

  take (str) {
    const buffer = this.get(str)

    if (buffer) {
      buffers = _.without(buffers, buffer)

      debug('found request buffer %o', { buffer: _.pick(buffer, 'url', 'originalUrl'), bufferCount: buffers.length })
    }

    return buffer
  },

}
