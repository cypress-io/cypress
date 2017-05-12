import {find, parse} from './util'
import path = require('path')
import Promise = require('bluebird')

const chromium = {
  version (p) {
    return parse(p, 'CFBundleShortVersionString')
  },

  path () {
    return find('org.chromium.Chromium')
  },

  get (executable) {
    return this.path()
    .then(p =>
      Promise.props({
        path:    path.join(p, executable),
        version: this.version(p)
      })
    )
  }
}

export default chromium
