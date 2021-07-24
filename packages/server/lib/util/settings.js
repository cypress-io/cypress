const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const errors = require('../errors')
const log = require('../log')
const { fs } = require('./fs')
const requireAsync = require('./require_async').default
const debug = require('debug')('cypress:server:settings')

function jsCode (obj) {
  const objJSON = obj && obj !== {} ? JSON.stringify(obj, null, 2) : `{

}`

  return `const { defineConfig } = require('cypress')

module.export = defineConfig(${objJSON})
`
}

function tsCode (obj) {
  const objJSON = obj && obj !== {} ? JSON.stringify(obj, null, 2) : `{

}`

  return `import { defineConfig } from 'cypress'

export default defineConfig(${objJSON})
`
}

// TODO:
// think about adding another PSemaphore
// here since we can read + write the
// settings at the same time something else
// is potentially reading it

const flattenCypress = (obj) => {
  return obj.cypress ? obj.cypress : undefined
}

const maybeVerifyConfigFile = Promise.method((configFile) => {
  if (configFile === false) {
    return
  }

  return fs.statAsync(configFile)
})

const renameVisitToPageLoad = (obj) => {
  const v = obj.visitTimeout

  if (v) {
    obj = _.omit(obj, 'visitTimeout')
    obj.pageLoadTimeout = v

    return obj
  }
}

const renameCommandTimeout = (obj) => {
  const c = obj.commandTimeout

  if (c) {
    obj = _.omit(obj, 'commandTimeout')
    obj.defaultCommandTimeout = c

    return obj
  }
}

const renameSupportFolder = (obj) => {
  const sf = obj.supportFolder

  if (sf) {
    obj = _.omit(obj, 'supportFolder')
    obj.supportFile = sf

    return obj
  }
}

module.exports = {
  _pathToFile (projectRoot, file) {
    return path.isAbsolute(file) ? file : path.join(projectRoot, file)
  },

  _err (type, file, err) {
    const e = errors.get(type, file, err)

    e.code = err.code
    e.errno = err.errno
    throw e
  },

  _logReadErr (file, err) {
    errors.throw('ERROR_READING_FILE', file, err)
  },

  _logWriteErr (file, err) {
    return this._err('ERROR_WRITING_FILE', file, err)
  },

  _write (file, obj = {}) {
    if (/\.json$/.test(file)) {
      debug('writing json file')

      return fs.outputJsonAsync(file, obj, { spaces: 2 })
      .return(obj)
      .catch((err) => {
        return this._logWriteErr(file, err)
      })
    }

    debug('writing javascript file')

    const code = /\.ts$/.test(file) ? tsCode : jsCode

    return fs.writeFileAsync(file, code(obj))
    .return(obj)
    .catch((err) => {
      return this._logWriteErr(file, err)
    })
  },

  _applyRewriteRules (obj = {}) {
    return _.reduce([flattenCypress, renameVisitToPageLoad, renameCommandTimeout, renameSupportFolder], (memo, fn) => {
      const ret = fn(memo)

      return ret ? ret : memo
    }, _.cloneDeep(obj))
  },

  isComponentTesting (options = {}) {
    return options.testingType === 'component'
  },

  configFile (projectRoot, options = {}) {
    const ls = fs.readdirSync(projectRoot)

    if (options.configFile === false) {
      return false
    }

    if (options.configFile) {
      return options.configFile
    }

    if (ls.includes('cypress.config.ts')) {
      return 'cypress.config.ts'
    }

    if (ls.includes('cypress.config.js')) {
      return 'cypress.config.js'
    }

    if (ls.includes('cypress.json')) {
      return 'cypress.json'
    }

    // if we find a tsconfig.json let's make users life easy
    // and create a TypeScript file.
    if (ls.includes('tsconfig.json')) {
      return 'cypress.config.ts'
    }

    // Default is to create a new `cypress.config.js` file if one does not exist.
    return 'cypress.config.js'
  },

  id (projectRoot, options = {}) {
    const file = this.pathToConfigFile(projectRoot, options)

    return fs.readJsonAsync(file)
    .get('projectId')
    .catch(() => {
      return null
    })
  },

  /**
   * Ensures the project at this root has a config file
   * that is readable and writable by the node process
   * @param {string} projectRoot root of the project
   * @param {object} options
   * @returns
   */
  exists (projectRoot, options = {}) {
    const file = this.pathToConfigFile(projectRoot, options)

    debug('find out if "%s" exists', file)

    // first check if cypress.json exists
    return maybeVerifyConfigFile(file)
    .then(() => {
      // if it does also check that the projectRoot
      // directory is writable
      return fs.accessAsync(projectRoot, fs.W_OK)
    }).catch({ code: 'ENOENT' }, () => {
      debug('no module error')
      // cypress.config.js does not exist, completely new project
      log('cannot find file %s', file)

      return this._err('CONFIG_FILE_NOT_FOUND', this.configFile(projectRoot, options), projectRoot)
    }).catch({ code: 'EACCES' }, () => {
      debug('no access error')

      // we cannot write due to folder permissions
      return errors.warning('FOLDER_NOT_WRITABLE', projectRoot)
    }).catch((err) => {
      if (errors.isCypressErr(err)) {
        debug('throwing error')
        throw err
      }

      return this._logReadErr(file, err)
    })
  },

  read (projectRoot, options = {}) {
    if (options.configFile === false) {
      return Promise.resolve({})
    }

    const file = this.pathToConfigFile(projectRoot, options)

    return requireAsync(file,
      {
        projectRoot,
        loadErrorCode: 'CONFIG_FILE_ERROR',
      })
    .catch((err) => {
      if (err.type === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
        debug('file not found', file)

        return this._write(file, {})
      }

      return Promise.reject(err)
    })
    .then((configObject = {}) => {
      const testingType = this.isComponentTesting(options) ? 'component' : 'e2e'

      debug('resolved configObject', configObject)

      if (testingType in configObject && typeof configObject[testingType] === 'object') {
        configObject = { ...configObject, ...configObject[testingType] }
      }

      const changed = this._applyRewriteRules(configObject)

      // if our object is unchanged
      // then just return it
      if (_.isEqual(configObject, changed)) {
        configObject.configFile = path.relative(projectRoot, file)

        return configObject
      }

      // else write the new reduced obj
      return this._write(file, changed)
      .then(function (config) {
        // when configfile is written, update the value of the configfile
        // with the value found.
        // NOTE: it does not have to be cypress.json.
        // it could be ./e2e/custom-config.json or cypress.config.js
        config.configFile = path.relative(projectRoot, file)

        return config
      })
    }).catch((err) => {
      debug('an error occured when reading config', err)
      if (errors.isCypressErr(err)) {
        throw err
      }

      return this._logReadErr(file, err)
    })
  },

  readEnv (projectRoot) {
    const file = this.pathToCypressEnvJson(projectRoot)

    return fs.readJsonAsync(file)
    .catch({ code: 'ENOENT' }, () => {
      return {}
    })
    .catch((err) => {
      if (errors.isCypressErr(err)) {
        throw err
      }

      return this._logReadErr(file, err)
    })
  },

  write (projectRoot, obj = {}, options = {}) {
    if (options.configFile === false) {
      return Promise.resolve({})
    }

    debug('write a file')

    return this.read(projectRoot, options)
    .then((settings) => {
      _.extend(settings, obj)

      const file = this.pathToConfigFile(projectRoot, options)

      return this._write(file, settings)
    })
  },

  remove (projectRoot, options = {}) {
    return fs.unlinkSync(this.pathToConfigFile(projectRoot, options))
  },

  pathToConfigFile (projectRoot, options = {}) {
    const configFile = this.configFile(projectRoot, options)

    return configFile && this._pathToFile(projectRoot, configFile)
  },

  pathToCypressEnvJson (projectRoot) {
    return this._pathToFile(projectRoot, 'cypress.env.json')
  },
}
