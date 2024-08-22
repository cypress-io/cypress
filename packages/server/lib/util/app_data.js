const os = require('os')
const path = require('path')
const ospath = require('ospath')
const Promise = require('bluebird')
const la = require('lazy-ass')
const check = require('check-more-types')
const log = require('debug')('cypress:server:appdata')
const pkg = require('@packages/root')
const { fs } = require('../util/fs')
const cwd = require('../cwd')
const md5 = require('md5')
const sanitize = require('sanitize-filename')
const replace = require('lodash/replace')

const PRODUCT_NAME = pkg.productName || pkg.name

const findCommonAncestor = (path1, path2) => {
  const sep = os.platform() === 'win32' ? '\\' : '/'

  function* commonArrayMembersGenerator (path1, path2) {
    const [longer, shorter] = path1.length > path2.length ? [path1, path2] : [path2, path1]

    // find when the paths eventually differ.
    for (const pathSegment of shorter) {
      if (pathSegment === longer.shift()) {
        yield pathSegment
      } else {
        break
      }
    }
  }

  return path1 === path2 ? path1
    : path.parse(path1).root !== path.parse(path2).root ? null
      : [...commonArrayMembersGenerator(path.normalize(path1).split(sep), path.normalize(path2).split(sep))].join(sep)
}

const getElectronAppDataPath = () => {
  const OS_DATA_PATH = ospath.data()
  const ELECTRON_APP_DATA_PATH = path.join(OS_DATA_PATH, PRODUCT_NAME)

  return ELECTRON_APP_DATA_PATH
}

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

const toHashName = (projectRoot) => {
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

const modifyFileIfOutsideProjectDirectory = (projectRoot, filePath) => {
  /**
   * files that live outside of the project directory
   * do not resolve correctly on Windows as we are trying to resolve the file to the project directory.
   * This issue is only noticeable on windows since the absolute path gets appended to the project bundle
   * path. In Unix based systems, this goes unnoticed because:
   *     /Users/foo/project/nested/hash-bundle/Users/foo/project/file.js
   * is a valid path in Unix, but
   *     C:\\Users\\foo\\project\\nested\\hash-bundleC:\\Users\\foo\\project\\file.js
   * is not a valid path in Windows
   *
   * To resolve this issue, we find the common ancestor directory between the project and file,
   * take the path AFTER the common ancestor directory of the file, and append it to the project bundle directory.
   * Effectively:
   *     C:\\Users\\foo\\project\\nested\\hash-bundleC:\\Users\\foo\\project\\file.js
   * will become
   *     C:\\Users\\foo\\project\\nested\\hash-bundle\\file.js
   * @see https://github.com/cypress-io/cypress/issues/8599
   */

  const relative = path.relative(projectRoot, filePath)
  const isSubDirectory = relative && !relative.startsWith('..') && !path.isAbsolute(relative)

  // if the file does NOT live inside the project directory,
  // find the common ancestor of the project and file to get the file subpath to append to the project bundle directory
  if (!isSubDirectory) {
    const commonDirectoryPath = findCommonAncestor(projectRoot, filePath)

    filePath = replace(filePath, commonDirectoryPath, '')
  }

  return filePath
}

module.exports = {
  toHashName,
  findCommonAncestor,
  getBundledFilePath (projectRoot, filePath) {
    return this.projectsPath(toHashName(projectRoot), 'bundles', modifyFileIfOutsideProjectDirectory(projectRoot, filePath))
  },

  ensure () {
    const ensure = () => {
      return this.removeSymlink()
      .then(() => {
        return Promise.join(
          fs.ensureDirAsync(this.path()),
          !isProduction() ? this.symlink() : undefined,
        )
      })
    }

    // try twice to ensure the dir
    return ensure()
    .tapCatch(() => Promise.delay(100))
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

    la(check.unemptyString(env.CYPRESS_INTERNAL_ENV),
      'expected CYPRESS_INTERNAL_ENV, found', env.CYPRESS_INTERNAL_ENV)

    // allow overriding the app_data folder
    let folder = env.CYPRESS_CONFIG_ENV || env.CYPRESS_INTERNAL_ENV

    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      folder = `${folder}-e2e-test`
    }

    const p = path.join(getElectronAppDataPath(), 'cy', folder, ...paths)

    log('path: %s', p)

    return p
  },

  electronPartitionsPath () {
    return path.join(getElectronAppDataPath(), 'Partitions')
  },

  projectsPath (...paths) {
    return this.path('projects', ...paths)
  },

  remove () {
    return Promise.join(
      fs.removeAsync(this.path()),
      this.removeSymlink(),
    )
  },

}
