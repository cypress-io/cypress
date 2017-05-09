import {log} from '../log'

import {parse, find} from './util'
import path = require('path')
import Promise = require('bluebird')

const chrome = {
  version (p) {
    return parse(p, 'KSVersion')
  },

  path () {
    return find('com.google.Chrome')
  },

  get (executable) {
    log('Looking for Chrome %s', executable)
    return this.path()
      .then(p => {
        return Promise.props({
          path:    path.join(p, executable),
          version: this.version(p)
        })
      })
  }
}

export default chrome
