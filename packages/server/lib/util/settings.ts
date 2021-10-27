import _ from 'lodash'
import Promise from 'bluebird'
import path from 'path'
import errors from '../errors'
import { fs } from '../util/fs'
import { requireAsync } from './require_async'
import Debug from 'debug'
import type { SettingsOptions } from '@packages/types'

const debug = Debug('cypress:server:settings')

function configCode (obj, isTS?: boolean) {
  const objJSON = obj && !_.isEmpty(obj)
    ? JSON.stringify(_.omit(obj, 'configFile'), null, 2)
    : `{

}`

  if (isTS) {
    return `export default ${objJSON}`
  }

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

function _pathToFile (projectRoot, file) {
  return path.isAbsolute(file) ? file : path.join(projectRoot, file)
}

function _err (type, file, err) {
  const e = errors.get(type, file, err)

  e.code = err.code
  e.errno = err.errno
  throw e
}

function _logReadErr (file, err) {
  errors.throw('ERROR_READING_FILE', file, err)
}

function _logWriteErr (file, err) {
  return _err('ERROR_WRITING_FILE', file, err)
}

function _write (file, obj = {}) {
  if (/\.json$/.test(file)) {
    debug('writing json file')

    return fs.outputJson(file, obj, { spaces: 2 })
    .then(() => obj)
    .catch((err) => {
      return _logWriteErr(file, err)
    })
  }

  debug('writing javascript file')

  const fileExtension = file?.split('.').pop()

  const isTSFile = fileExtension === 'ts'

  return fs.writeFileAsync(file, configCode(obj, isTSFile))
  .return(obj)
  .catch((err) => {
    return _logWriteErr(file, err)
  })
}

function _applyRewriteRules (obj = {}) {
  return _.reduce([flattenCypress, renameVisitToPageLoad, renameCommandTimeout, renameSupportFolder], (memo, fn) => {
    const ret = fn(memo)

    return ret ? ret : memo
  }, _.cloneDeep(obj))
}

export function isComponentTesting (options: SettingsOptions = {}) {
  return options.testingType === 'component'
}

export function configFile (options: SettingsOptions = {}) {
  return options.configFile === false ? false : options.configFile
}

// TODO: Should we get it from the cache (?)
export function id (projectRoot, options = {}) {
  return read(projectRoot, options)
  .then((config) => config.projectId)
  .catch(() => {
    return null
  })
}

export function read (projectRoot, options: SettingsOptions = {}) {
  if (options.configFile === false) {
    return Promise.resolve({})
  }

  const file = pathToConfigFile(projectRoot, options)

  return requireAsync(file, {
    projectRoot,
    loadErrorCode: 'CONFIG_FILE_ERROR',
  })
  .catch((err) => {
    if (err.type === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
      return Promise.reject(errors.get('CONFIG_FILE_NOT_FOUND', options.configFile, projectRoot))
    }

    return Promise.reject(err)
  })
  .then((configObject = {}) => {
    if (isComponentTesting(options) && 'component' in configObject) {
      configObject = { ...configObject, ...configObject.component }
    }

    if (!isComponentTesting(options) && 'e2e' in configObject) {
      configObject = { ...configObject, ...configObject.e2e }
    }

    debug('resolved configObject', configObject)
    const changed: { projectId?: string, component?: {}, e2e?: {} } = _applyRewriteRules(configObject)

    // if our object is unchanged
    // then just return it
    if (_.isEqual(configObject, changed)) {
      return configObject
    }

    // else write the new reduced obj and store the projectId on the cache
    return _write(file, changed)
    .then((config) => {
      return config
    })
  }).catch((err) => {
    debug('an error occured when reading config', err)
    if (errors.isCypressErr(err)) {
      throw err
    }

    return _logReadErr(file, err)
  })
}

export function readEnv (projectRoot) {
  const file = pathToCypressEnvJson(projectRoot)

  return fs.readJson(file)
  .catch((err) => {
    if (err.code === 'ENOENT') {
      return {}
    }

    if (errors.isCypressErr(err)) {
      throw err
    }

    return _logReadErr(file, err)
  })
}

export function write (projectRoot, obj = {}, options: SettingsOptions = {}) {
  if (options.configFile === false) {
    return Promise.resolve({})
  }

  return read(projectRoot, options)
  .then((settings) => {
    _.extend(settings, obj)

    const file = pathToConfigFile(projectRoot, options)

    return _write(file, settings)
  })
}

export function pathToConfigFile (projectRoot, options: SettingsOptions = {}) {
  const file = configFile(options)

  return file && _pathToFile(projectRoot, file)
}

export function pathToCypressEnvJson (projectRoot) {
  return _pathToFile(projectRoot, 'cypress.env.json')
}
