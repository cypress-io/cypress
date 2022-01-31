const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const os = require('os')
const cypressEx = require('@packages/example')
const { fs } = require('./util/fs')
const cwd = require('./cwd')
const debug = require('debug')('cypress:server:scaffold')
const errors = require('./errors')
const { isDefault } = require('./util/config')

const getExampleSpecsFullPaths = cypressEx.getPathToExamples()
const getExampleFolderFullPaths = cypressEx.getPathToExampleFolders()

const getPathFromE2EFolder = (file) => {
  return file.substring(file.indexOf('e2e/') + 'e2e/'.length)
}

const getExampleSpecs = (foldersOnly = false) => {
  const paths = foldersOnly ? getExampleFolderFullPaths : getExampleSpecsFullPaths

  return paths
  .then((fullPaths) => {
    // short paths relative to e2e folder (i.e. examples/actions.spec.js)
    const shortPaths = _.map(fullPaths, (file) => {
      return getPathFromE2EFolder(file)
    })

    // index for quick lookup and for getting full path from short path
    const index = _.transform(shortPaths, (memo, spec, i) => {
      return memo[spec] = fullPaths[i]
    }, {})

    return { fullPaths, shortPaths, index }
  })
}

const getIndexedExample = (file, index) => {
  // convert to using posix sep if on win
  if (os.platform() === 'win32') {
    file = file.split(path.sep).join(path.posix.sep)
  }

  return index[getPathFromE2EFolder(file)]
}

const getFileSize = (file) => {
  return fs.statAsync(file).get('size')
}

const fileSizeIsSame = (file, index) => {
  return Promise.join(
    getFileSize(file),
    getFileSize(getIndexedExample(file, index)),
  ).spread((fileSize, originalFileSize) => {
    return fileSize === originalFileSize
  }).catch((e) => {
    // if the file does not exist, return false
    return false
  })
}

const componentTestingEnabled = (config) => {
  const componentTestingEnabled = _.get(config, 'resolved.testingType.value', 'e2e') === 'component'

  return componentTestingEnabled && !isDefault(config, 'componentFolder')
}

const isNewProject = (config) => {
  return false
}

module.exports = {
  isNewProject,

  e2e (folder, config) {
    debug(`e2e folder ${folder}`)

    // skip if user has explicitly set e2eFolder
    // or if user has set up component testing
    if (!isDefault(config, 'e2eFolder') || componentTestingEnabled(config)) {
      return Promise.resolve()
    }

    return this.verifyScaffolding(folder, () => {
      debug(`copying examples into ${folder}`)

      return getExampleSpecs()
      .then(({ fullPaths }) => {
        return Promise.all(_.map(fullPaths, (file) => {
          return this._copy(file, folder)
        }))
      })
    })
  },

  fixture (folder, config) {
    debug(`fixture folder ${folder}`)

    // skip if user has explicitly set fixturesFolder
    if (!config.fixturesFolder || !isDefault(config, 'fixturesFolder')) {
      return Promise.resolve()
    }

    return this.verifyScaffolding(folder, () => {
      debug(`copying example.json into ${folder}`)

      return this._copy(cypressEx.getPathToFixture(), folder)
    })
  },

  plugins (folder, config) {
    debug(`plugins folder ${folder}`)
    // skip if user has explicitly set pluginsFile
    if (!config.pluginsFile || !isDefault(config, 'pluginsFile')) {
      return Promise.resolve()
    }

    return this.verifyScaffolding(folder, () => {
      debug(`copying index.js into ${folder}`)

      return this._copy(cypressEx.getPathToPlugins(), folder)
    })
  },

  _copy (file, folder) {
    // allow file to be relative or absolute
    const src = path.resolve(cwd('lib', 'scaffold'), file)
    const destFile = path.basename(file)
    const dest = path.join(folder, destFile)

    return fs.copyAsync(src, dest)
    .catch((error) => {
      if (error.code === 'EACCES') {
        error = errors.get('ERROR_WRITING_FILE', dest, error)
      }

      throw error
    })
  },

  _removeFile (file, folder, index) {
    const dest = path.join(folder, file)

    return fileSizeIsSame(dest, index)
    .then((isSame) => {
      if (isSame) {
        // catch all errors since the user may have already removed
        // the file or changed permissions, etc.
        return fs.removeAsync(dest).catch(_.noop)
      }
    })
  },

  _removeFolder (folderPath, folder) {
    const dest = path.join(folder, folderPath)

    // catch all errors since the user may have already removed
    // the folder, changed permissions, added their own files to the folder, etc.
    return fs.rmdirAsync(dest).catch(_.noop)
  },

  verifyScaffolding (folder, fn) {
    // we want to build out the folder + and example files
    // but only create the example files if the folder doesn't
    // exist
    //
    // this allows us to automatically insert the folder on existing
    // projects (whenever they are booted) but allows the user to delete
    // the file and not have it re-generated each time
    //
    // this is ideal because users who are upgrading to newer cypress version
    // will still get the files scaffolded but existing users won't be
    // annoyed by new example files coming into their projects unnecessarily
    // console.debug('-- verify', folder)
    debug(`verify scaffolding in ${folder}`)

    return fs.statAsync(folder)
    .then(() => {
      return debug(`folder ${folder} already exists`)
    }).catch(() => {
      debug(`missing folder ${folder}`)

      return fn.call(this)
    })
  },
}
