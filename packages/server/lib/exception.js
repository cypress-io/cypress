const _ = require('lodash')
const Promise = require('bluebird')
const pkg = require('@packages/root')
const api = require('./api')
const user = require('./user')
const system = require('./util/system')

// strip everything but the file name to remove any sensitive
// data in the path
const pathRe = /'?((\/|\\+|[a-z]:\\)[^\s']+)+'?/ig
const pathSepRe = /[\/\\]+/
const stripPath = (text) => {
  return (text || '').replace(pathRe, (path) => {
    const fileName = _.last(path.split(pathSepRe)) || ''

    return `<stripped-path>${fileName}`
  })
}

module.exports = {
  getErr (err) {
    return {
      name: stripPath(err.name),
      message: stripPath(err.message),
      stack: stripPath(err.stack),
    }
  },

  getVersion () {
    return pkg.version
  },

  getBody (err) {
    return system.info()
    .then((systemInfo) => {
      return _.extend({
        err: this.getErr(err),
        version: this.getVersion(),
      }, systemInfo)
    })
  },

  getAuthToken () {
    return user.get().then((user) => {
      return user && user.authToken
    })
  },

  async create (err) {
    if ((process.env['CYPRESS_INTERNAL_ENV'] !== 'production') ||
       (process.env['CYPRESS_CRASH_REPORTS'] === '0')) {
      return
    }

    try {
      const [body, authToken] = await Promise.all([
        this.getBody(err),
        this.getAuthToken(),
      ])

      await api.createCrashReport(body, authToken)
    } catch (_err) {
      // nothing to do
    }
  },
}
