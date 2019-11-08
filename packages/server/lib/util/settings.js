/* eslint-disable
    brace-style,
    no-cond-assign,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const errors = require('../errors')
const log = require('../log')
const fs = require('../util/fs')

//# TODO:
//# think about adding another PSemaphore
//# here since we can read + write the
//# settings at the same time something else
//# is potentially reading it

const flattenCypress = function (obj) {
  let cypress

  if (cypress = obj.cypress) {
    return cypress
  }
}

const maybeVerifyConfigFile = Promise.method((configFile) => {
  if (configFile === false) {
    return
  }

  return fs.statAsync(configFile)
})

const renameVisitToPageLoad = function (obj) {
  let v

  if (v = obj.visitTimeout) {
    obj = _.omit(obj, 'visitTimeout')
    obj.pageLoadTimeout = v

    return obj
  }
}

const renameCommandTimeout = function (obj) {
  let c

  if (c = obj.commandTimeout) {
    obj = _.omit(obj, 'commandTimeout')
    obj.defaultCommandTimeout = c

    return obj
  }
}

const renameSupportFolder = function (obj) {
  let sf

  if (sf = obj.supportFolder) {
    obj = _.omit(obj, 'supportFolder')
    obj.supportFile = sf

    return obj
  }
}

module.exports = {
  _pathToFile (projectRoot, file) {
    return path.join(projectRoot, file)
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
    return fs.outputJsonAsync(file, obj, { spaces: 2 })
    .return(obj)
    .catch((err) => {
      return this._logWriteErr(file, err)
    })
  },

  _applyRewriteRules (obj = {}) {
    return _.reduce([flattenCypress, renameVisitToPageLoad, renameCommandTimeout, renameSupportFolder], (memo, fn) => {
      let ret

      if (ret = fn(memo)) {
        return ret
      }

      return memo
    }
    , _.cloneDeep(obj))
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

  exists (projectRoot, options = {}) {
    const file = this.pathToConfigFile(projectRoot, options)

    // first check if cypress.json exists
    return maybeVerifyConfigFile(file)
    .then(() =>
    // if it does also check that the projectRoot
    // directory is writable
    {
      return fs.accessAsync(projectRoot, fs.W_OK)
    }).catch({ code: 'ENOENT' }, (err) => {
      // cypress.json does not exist, we missing project
      log('cannot find file %s', file)

      return this._err('CONFIG_FILE_NOT_FOUND', this.configFile(options), projectRoot)
    }).catch((err) => {
      if (errors.isCypressErr(err)) {
        throw err
      }

      // else we cannot read due to folder permissions
      return this._logReadErr(file, err)
    })
  },

  read (projectRoot, options = {}) {
    if (options.configFile === false) {
      return Promise.resolve({})
    }

    const file = this.pathToConfigFile(projectRoot, options)

    return fs.readJsonAsync(file)
    .catch({ code: 'ENOENT' }, () => {
      return this._write(file, {})
    }).then((json = {}) => {
      const changed = this._applyRewriteRules(json)

      //# if our object is unchanged
      //# then just return it
      if (_.isEqual(json, changed)) {
        return json
      }

      //# else write the new reduced obj
      return this._write(file, changed)
    }).catch((err) => {
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

    return this.read(projectRoot)
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
    const configFile = this.configFile(options)

    return configFile && this._pathToFile(projectRoot, configFile)
  },

  pathToCypressEnvJson (projectRoot) {
    return this._pathToFile(projectRoot, 'cypress.env.json')
  },
}
