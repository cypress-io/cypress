import _ from 'lodash'
import Promise from 'bluebird'
import path from 'path'
import errors from '../errors'
import { fs } from '../util/fs'
import Debug from 'debug'
import type { SettingsOptions } from '@packages/types'
import { getCtx } from '@packages/data-context'

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

function _write (file, obj: any = {}) {
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

export function isComponentTesting (options: SettingsOptions = {}) {
  return options.testingType === 'component'
}

export function configFile (options: SettingsOptions = {}) {
  // default is only used in tests.
  // This prevents a the change from becoming bigger than it should
  return options.configFile === false ? false : (options.configFile || 'cypress.config.js')
}

export function id (projectRoot, options = {}) {
  return read(projectRoot, options)
  .then((config) => config.projectId)
  .catch(() => {
    return null
  })
}

export function read (projectRoot, options: SettingsOptions = {}) {
  if (options.configFile === false) {
    return Promise.resolve({} as Partial<Cypress.ConfigOptions>)
  }

  const file = pathToConfigFile(projectRoot, options)

  return getCtx().config.getOrCreateBaseConfig(file)
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

    return configObject
  }).catch((err) => {
    debug('an error occurred when reading config', err)
    if (errors.isCypressErr(err)) {
      throw err
    }

    throw _logReadErr(file, err)
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

export function writeOnly (projectRoot, obj = {}, options: SettingsOptions = {}) {
  if (options.configFile === false) {
    return Promise.resolve({})
  }

  const file = pathToConfigFile(projectRoot, options)

  return _write(file, obj)
}

export function pathToConfigFile (projectRoot, options: SettingsOptions = {}) {
  const file = configFile(options)

  return file && _pathToFile(projectRoot, file)
}

export function pathToCypressEnvJson (projectRoot) {
  return _pathToFile(projectRoot, 'cypress.env.json')
}
