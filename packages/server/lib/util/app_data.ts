import os from 'os'
import path from 'path'
import ospath from 'ospath'
import Bluebird from 'bluebird'
import la from 'lazy-ass'
import check from 'check-more-types'
import { fs } from '../util/fs'
import cwd from '../cwd'
import md5 from 'md5'
import sanitize from 'sanitize-filename'

const log = require('debug')('cypress:server:appdata')
const pkg = require('@packages/root')

const PRODUCT_NAME = pkg.productName || pkg.name
const OS_DATA_PATH = ospath.data()

const ELECTRON_APP_DATA_PATH = path.join(OS_DATA_PATH, PRODUCT_NAME)

if (!PRODUCT_NAME) {
  throw new Error('Root package is missing name')
}

const getSymlinkType = () => {
  if (os.platform() === 'win32') {
    return 'junction'
  }

  return 'dir'
}

const isProduction = () => {
  return process.env.CYPRESS_INTERNAL_ENV === 'production'
}

const toHashName = (projectRoot: string) => {
  if (!projectRoot) {
    throw new Error('Missing project path')
  }

  if (!path.isAbsolute(projectRoot)) {
    throw new Error(`Expected project absolute path, not just a name ${projectRoot}`)
  }

  const name = sanitize(path.basename(projectRoot))
  const hash = md5(projectRoot)

  return `${name}-${hash}`
}

export = {
  toHashName,

  getBundledFilePath (projectRoot, filePath) {
    return this.projectsPath(toHashName(projectRoot), 'bundles', filePath)
  },

  ensure () {
    const ensure = () => {
      return this.removeSymlink()
      .then(() => {
        return Bluebird.all([
          fs.ensureDirAsync(this.path()),
          !isProduction() ? this.symlink() : undefined,
        ])
      })
    }

    // try twice to ensure the dir
    return ensure()
    .tapCatch(() => Bluebird.delay(100))
    .catch(ensure)
  },

  symlink () {
    const src = path.dirname(this.path())
    const dest = cwd('.cy')

    log('symlink folder from %s to %s', src, dest)
    const symlinkType = getSymlinkType()

    // @ts-ignore - based on code, should be valid... 'junction' for windows is not in the types
    return fs.ensureSymlinkAsync(src, dest, symlinkType)
  },

  removeSymlink () {
    return fs.removeAsync(cwd('.cy')).catch(() => {})
  },

  path (...paths) {
    const { env } = process

    la(check.unemptyString(env.CYPRESS_INTERNAL_ENV),
      'expected CYPRESS_INTERNAL_ENV, found', env.CYPRESS_INTERNAL_ENV)

    // allow overriding the app_data folder
    let folder = env.CYPRESS_KONFIG_ENV || env.CYPRESS_INTERNAL_ENV!

    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF === 'true') {
      folder = `${folder}-e2e-test`
    }

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
    return Bluebird.all([
      fs.removeAsync(this.path()),
      this.removeSymlink(),
    ])
  },

}
