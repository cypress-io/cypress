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
    return this._err('ERROR_READING_FILE', file, err)
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

  id (projectRoot) {
    const file = this._pathToFile(projectRoot, 'cypress.json')

    return fs.readJsonAsync(file)
    .get('projectId')
    .catch(() => {
      return null
    })
  },

  exists (projectRoot) {
    const file = this._pathToFile(projectRoot, 'cypress.json')

    //# first check if cypress.json exists
    return fs.statAsync(file)
    .then(() =>
    //# if it does also check that the projectRoot
    //# directory is writable
    {
      return fs.accessAsync(projectRoot, fs.W_OK)
    }).catch({ code: 'ENOENT' }, (err) => {
      //# cypress.json does not exist, we missing project
      log('cannot find file %s', file)

      return this._err('PROJECT_DOES_NOT_EXIST', projectRoot, err)
    }).catch((err) => {
      if (errors.isCypressErr(err)) {
        throw err
      }

      //# else we cannot read due to folder permissions
      return this._logReadErr(file, err)
    })
  },

  read (projectRoot) {
    const file = this._pathToFile(projectRoot, 'cypress.json')

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
    const file = this._pathToFile(projectRoot, 'cypress.env.json')

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

  write (projectRoot, obj = {}) {
    return this.read(projectRoot)
    .then((settings) => {
      _.extend(settings, obj)

      const file = this._pathToFile(projectRoot, 'cypress.json')

      return this._write(file, settings)
    })
  },

  remove (projectRoot) {
    return fs.unlinkSync(this._pathToFile(projectRoot, 'cypress.json'))
  },

  pathToCypressJson (projectRoot) {
    return this._pathToFile(projectRoot, 'cypress.json')
  },

  pathToCypressEnvJson (projectRoot) {
    return this._pathToFile(projectRoot, 'cypress.env.json')
  },
}
