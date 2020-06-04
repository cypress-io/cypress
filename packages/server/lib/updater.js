const _ = require('lodash')
const debug = require('debug')('cypress:server:updater')
const semver = require('semver')
const request = require('@cypress/request')
const NwUpdater = require('node-webkit-updater')
const pkg = require('@packages/root')
const { agent } = require('@packages/network')
const cwd = require('./cwd')
const konfig = require('./konfig')
const { machineId } = require('./util/machine_id')

NwUpdater.prototype.checkNewVersion = function (cb) {
  const gotManifest = function (err, req, data) {
    let e; let newVersion

    if (err) {
      return cb(err)
    }

    if ((req.statusCode < 200) || (req.statusCode > 299)) {
      return cb(new Error(req.statusCode))
    }

    try {
      data = JSON.parse(data)
    } catch (error) {
      e = error

      return cb(e)
    }

    try {
      // semver may throw here on invalid version
      newVersion = semver.gt(data.version, this.manifest.version)
    } catch (error1) {
      e = error1
      newVersion = false
    }

    return cb(null, newVersion, data)
  }

  const sendReq = (id) => {
    return request.get({
      url: this.manifest.manifestUrl,
      headers: {
        'x-cypress-version': pkg.version,
        'x-machine-id': id,
      },
      agent,
      proxy: null,
    }, gotManifest.bind(this))
  }

  // return hashed value because we dont care nor want
  // to know anything about you or your machine
  return machineId()
  .then(sendReq)
}

class Updater {
  constructor (callbacks) {
    if (!(this instanceof Updater)) {
      return new Updater(callbacks)
    }

    this.client = new NwUpdater(this.getPackage())
    this.request = null
    this.callbacks = callbacks

    if (process.env['CYPRESS_INTERNAL_ENV'] !== 'production') {
      this.patchAppPath()
    }
  }

  patchAppPath () {
    this.getClient().getAppPath = () => {
      return cwd()
    }
  }

  getPackage () {
    return _.extend({}, pkg, { manifestUrl: konfig('desktop_manifest_url') })
  }

  getClient () {
    // requiring inline due to easier testability
    return this.client != null ? this.client : (() => {
      throw new Error('missing Updater#client')
    })()
  }

  trigger (event, ...args) {
    // normalize event name
    let cb

    event = `on${event[0].toUpperCase()}${event.slice(1)}`
    cb = this.callbacks && this.callbacks[event]

    if (cb) {
      return cb.apply(this, args)
    }
  }

  check (options = {}) {
    debug('checking for new version of Cypress. current version is', pkg.version)

    return this.getClient().checkNewVersion((err, newVersionExists, manifest) => {
      if (err) {
        return this.trigger('error', err)
      }

      if (manifest) {
        debug('latest version of Cypress is:', manifest.version)
      }

      if (newVersionExists) {
        debug('new version of Cypress exists:', manifest.version)

        return (typeof options.onNewVersion === 'function' ? options.onNewVersion(manifest) : undefined)
      }

      debug('new version of Cypress does not exist')

      return (typeof options.onNoNewVersion === 'function' ? options.onNoNewVersion() : undefined)
    })
  }

  static check (options = {}) {
    return new Updater().check(options)
  }
}

module.exports = Updater
