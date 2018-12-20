// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const os = require('os')
const path = require('path')
const ospath = require('ospath')
const Promise = require('bluebird')
const la = require('lazy-ass')
const check = require('check-more-types')
const log = require('debug')('cypress:server:appdata')
const pkg = require('@packages/root')
const fs = require('../util/fs')
const cwd = require('../cwd')

const PRODUCT_NAME = pkg.productName || pkg.name
const OS_DATA_PATH = ospath.data()

const ELECTRON_APP_DATA_PATH = path.join(OS_DATA_PATH, PRODUCT_NAME)

if (!PRODUCT_NAME) {
  throw new Error('Root package is missing name')
}

const getSymlinkType = function () {
  if (os.platform() === 'win32') {
    return 'junction'
  }

  return 'dir'

}

const isProduction = () => {
  return process.env.CYPRESS_ENV === 'production'
}

module.exports = {
  ensure () {
    const ensure = () => {
      return this.removeSymlink()
      .then(() => {
        return Promise.join(
          fs.ensureDirAsync(this.path()),
          !isProduction() ? this.symlink() : undefined
        )
      })
    }

    //# try twice to ensure the dir
    return ensure()
    .catch(ensure)
  },

  symlink () {
    const src = path.dirname(this.path())
    const dest = cwd('.cy')

    log('symlink folder from %s to %s', src, dest)
    const symlinkType = getSymlinkType()

    return fs.ensureSymlinkAsync(src, dest, symlinkType)
  },

  removeSymlink () {
    return fs.removeAsync(cwd('.cy')).catch(() => {})
  },

  path (...paths) {
    const { env } = process

    la(check.unemptyString(env.CYPRESS_ENV),
      'expected CYPRESS_ENV, found', env.CYPRESS_ENV)

    //# allow overriding the app_data folder
    const folder = env.CYPRESS_KONFIG_ENV || env.CYPRESS_ENV

    const p = path.join(ELECTRON_APP_DATA_PATH, 'cy', folder, ...paths)

    log('path: %s', p)

    return p
  },

  electronPartitionsPath () {
    return path.join(ELECTRON_APP_DATA_PATH, 'Partitions')
  },

  projectsPath (...paths) {
    return this.path('projects', ...paths)
  },

  remove () {
    return Promise.join(
      fs.removeAsync(this.path()),
      this.removeSymlink()
    )
  },

}
