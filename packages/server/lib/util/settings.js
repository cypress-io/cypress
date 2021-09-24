const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const errors = require('../errors')
const log = require('../log')
const { fs } = require('../util/fs')
const { requireAsync } = require('./require_async')
const debug = require('debug')('cypress:server:settings')

function jsCode (obj) {
  const objJSON = obj && !_.isEmpty(obj)
    ? JSON.stringify(_.omit(obj, 'configFile'), null, 2)
    : `{

}`

  return `module.exports = ${objJSON}
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

    return fs.writeFileAsync(file, jsCode(obj))
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

  configFile (options = {}) {
    return options.configFile === false ? false : (options.configFile || 'cypress.json')
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

    // first check if cypress.json exists
    return maybeVerifyConfigFile(file)
    .then(() => {
      // if it does also check that the projectRoot
      // directory is writable
      return fs.accessAsync(projectRoot, fs.W_OK)
    }).catch({ code: 'ENOENT' }, () => {
      // cypress.json does not exist, completely new project
      log('cannot find file %s', file)

      return this._err('CONFIG_FILE_NOT_FOUND', this.configFile(options), projectRoot)
    }).catch({ code: 'EACCES' }, { code: 'EPERM' }, () => {
      // we cannot write due to folder permissions
      return errors.warning('FOLDER_NOT_WRITABLE', projectRoot)
    }).catch((err) => {
      if (errors.isCypressErr(err)) {
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
      if (this.isComponentTesting(options) && 'component' in configObject) {
        configObject = { ...configObject, ...configObject.component }
      }

      if (!this.isComponentTesting(options) && 'e2e' in configObject) {
        configObject = { ...configObject, ...configObject.e2e }
      }

      debug('resolved configObject', configObject)
      const changed = this._applyRewriteRules(configObject)

      // if our object is unchanged
      // then just return it
      if (_.isEqual(configObject, changed)) {
        return configObject
      }

      // else write the new reduced obj
      return this._write(file, changed)
      .then((config) => {
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

    return this.read(projectRoot, options)
    .then((settings) => {
      _.extend(settings, obj)

      const file = this.pathToConfigFile(projectRoot, options)

      return this._write(file, settings)
    })
  },

  pathToConfigFile (projectRoot, options = {}) {
    const configFile = this.configFile(options)

    return configFile && this._pathToFile(projectRoot, configFile)
  },

  pathToCypressEnvJson (projectRoot) {
    return this._pathToFile(projectRoot, 'cypress.env.json')
  },
}
