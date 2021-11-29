import _ from 'lodash'
import Promise from 'bluebird'
import path from 'path'
import errors from '../errors'
import { fs } from '../util/fs'
import Debug from 'debug'
import type { SettingsOptions } from '@packages/types'
import type { DataContext } from '@packages/data-context'
import assert from 'assert'

const debug = Debug('cypress:server:settings')

type ChangedConfig = { projectId?: string, component?: {}, e2e?: {} }

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
  throw errors.get('ERROR_READING_FILE', file, err)
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
  // default is only used in tests.
  // This prevents a the change from becoming bigger than it should
  return options.configFile || 'cypress.config.js'
}

export function read (ctx: DataContext, options: SettingsOptions = {}) {
  assert(ctx.currentProject?.currentTestingType, 'expected ctx.currentProject.currentTestingType in settings.read')
  assert(ctx.currentProject?.projectRoot, 'expected ctx.currentProject.projectRoot in settings.read')

  const projectRoot = ctx.currentProject.projectRoot
  const file = pathToConfigFile(projectRoot, options)

  return ctx.loadingManager.projectConfig.toPromise()
  .catch((err) => {
    if (err.type === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
      return Promise.reject(errors.get('CONFIG_FILE_NOT_FOUND', file, projectRoot))
    }

    return Promise.reject(err)
  })
  .then((configObject) => {
    if (ctx.currentTestingType === 'component' && 'component' in configObject) {
      configObject = { ...configObject, ...configObject.component }
    }

    if (ctx.currentTestingType !== 'component' && 'e2e' in configObject) {
      configObject = { ...configObject, ...configObject.e2e }
    }

    debug('resolved configObject', configObject)
    const changed: ChangedConfig = _applyRewriteRules(configObject)

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
    debug('an error occurred when reading config', err)
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

export function writeOnly (projectRoot, obj = {}, options: SettingsOptions = {}) {
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
