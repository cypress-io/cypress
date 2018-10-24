/* eslint-disable
    no-cond-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const url = require('url')
const debug = require('debug')('cypress:server:buffers')

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

    const parsed = url.parse(str)

    //# if we're on https and we have a port
    //# then attempt to find the buffer by
    //# slicing off the port since our buffer
    //# was likely stored without a port
    if ((parsed.protocol === 'https:') && parsed.port) {
      parsed.host = parsed.host.split(':')[0]
      parsed.port = null

      return find(parsed.format())
    }
  },

  take (str) {
    let buffer

    if (buffer = this.get(str)) {
      buffers = _.without(buffers, buffer)
    }

    return buffer
  },

}
