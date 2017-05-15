import {parse, find} from './util'
import path = require('path')
import Promise = require('bluebird')

const canary = {
  version: (p) =>
    parse(p, 'KSVersion'),

  path: () => find('com.google.Chrome.canary'),

  get (executable) {
    return this.path()
      .then (p => {
        return Promise.props({
          path:    path.join(p, executable),
          version: this.version(p)
        })
      })
  }
}

export default canary
