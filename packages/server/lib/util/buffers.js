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

    let parsed = uri.parse(str)

    //# if we're on https and we have a port
    //# then attempt to find the buffer by
    //# slicing off the port since our buffer
    //# was likely stored without a port
    if ((parsed.protocol === 'https:') && parsed.port) {
      parsed = uri.removePort(parsed)

      return find(parsed.format())
    }
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
