const _ = require('lodash')
const debug = require('debug')('cypress:server:buffers')
const uri = require('./uri')

let buffers = []

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
    obj.url = uri.removeDefaultPort(obj.url)
    obj.originalUrl = uri.removeDefaultPort(obj.originalUrl)

    return buffers.push(_.pick(obj, 'url', 'originalUrl', 'jar', 'stream', 'response', 'details'))
  },

  getByOriginalUrl (str) {
    return _.find(buffers, { originalUrl: str })
  },

  get (str) {
    const find = (str) => {
      return _.find(buffers, { url: str })
    }

    const b = find(str)

    if (b) {
      return b
    }

    return find(uri.removeDefaultPort(str))
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
