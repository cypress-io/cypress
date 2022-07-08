import Bluebird from 'bluebird'
import _ from 'lodash'
import Debug from 'debug'
import path from 'path'
import fs from 'fs-extra'
import deepDiff from 'return-deep-diff'

import errors, { ConfigValidationFailureInfo, CypressError } from '@packages/errors'
import { uri } from '@packages/network'
import { getCtx } from '@packages/data-context/src/globalContext'
import type {
  ResolvedFromConfig, TestingType,
} from '@packages/types'

import {
  allowed,
  getDefaultValues,
  validate,
  validateNoBreakingConfig,
} from '../browser'
import { options } from '../options'
import {
  parseEnv,
  checkIfResolveChangedRootFolder,
  resolveConfigValues,
  setPluginResolvedOn,
} from './utils'

const debug = Debug('cypress:config:project')

const folders = _(options).filter({ isFolder: true }).map('name').value()

const convertRelativeToAbsolutePaths = (projectRoot, obj) => {
  return _.reduce(folders, (memo, folder) => {
    const val = obj[folder]

    if ((val != null) && (val !== false)) {
      memo[folder] = path.resolve(projectRoot, val)
    }

    return memo
  }, {})
}

// an object with a few utility methods for easy stubbing from unit tests
export const utils = {
  resolveModule (name) {
    return require.resolve(name)
  },

  // returns:
  //   false - if the file should not be set
  //   string - found filename
  //   null - if there is an error finding the file
  discoverModuleFile (options) {
    debug('discover module file %o', options)
    const { filename } = options

    // they have it explicitly set, so it should be there
    return fs.pathExists(filename)
    .then((found) => {
      if (found) {
        debug('file exists, assuming it will load')

        return filename
      }

      debug('could not find %o', { filename })

      return null
    })
  },
}

function isValidCypressInternalEnvValue (value) {
  // names of config environments, see "config/app.yml"
  const names = ['development', 'test', 'staging', 'production']

  return _.includes(names, value)
}

export function setupFullConfigWithDefaults (obj: Record<string, any> = {}) {
  debug('setting config object %o', obj)
  let { projectRoot, projectName, config, envFile, options, cliConfig } = obj

  // just force config to be an object so we dont have to do as much
  // work in our tests
  if (config == null) {
    config = {}
  }

  debug('config is %o', config)

  // flatten the object's properties into the master config object
  config.envFile = envFile
  config.projectRoot = projectRoot
  config.projectName = projectName

  return mergeDefaults(config, options, cliConfig)
}

export function mergeDefaults (
  config: Record<string, any> = {},
  options: Record<string, any> = {},
  cliConfig: Record<string, any> = {},
) {
  const resolved: any = {}

  config.rawJson = _.cloneDeep(config)

  _.extend(config, _.pick(options, 'configFile', 'morgan', 'isTextTerminal', 'socketId', 'report', 'browsers'))
  debug('merged config with options, got %o', config)

  _
  .chain(allowed({ ...cliConfig, ...options }))
  .omit('env')
  .omit('browsers')
  .each((val: any, key) => {
    // If users pass in testing-type specific keys (eg, specPattern),
    // we want to merge this with what we've read from the config file,
    // rather than override it entirely.
    if (typeof config[key] === 'object' && typeof val === 'object') {
      if (Object.keys(val).length) {
        resolved[key] = 'cli'
        config[key] = { ...config[key], ...val }
      }
    } else {
      resolved[key] = 'cli'
      config[key] = val
    }
  }).value()

  let url = config.baseUrl

  if (url) {
    // replace multiple slashes at the end of string to single slash
    // so http://localhost/// will be http://localhost/
    // https://regexr.com/48rvt
    config.baseUrl = url.replace(/\/\/+$/, '/')
  }

  const defaultsForRuntime = getDefaultValues(options)

  _.defaultsDeep(config, defaultsForRuntime)

  let additionalIgnorePattern = config.additionalIgnorePattern

  if (options.testingType === 'component' && config.e2e && config.e2e.specPattern) {
    additionalIgnorePattern = config.e2e.specPattern
  }

  config = {
    ...config,
    ...config[options.testingType],
    additionalIgnorePattern,
  }

  // split out our own app wide env from user env variables
  // and delete envFile
  config.env = parseEnv(config, { ...cliConfig.env, ...options.env }, resolved)

  config.cypressEnv = process.env.CYPRESS_INTERNAL_ENV
  debug('using CYPRESS_INTERNAL_ENV %s', config.cypressEnv)
  if (!isValidCypressInternalEnvValue(config.cypressEnv)) {
    throw errors.throwErr('INVALID_CYPRESS_INTERNAL_ENV', config.cypressEnv)
  }

  delete config.envFile

  // when headless
  if (config.isTextTerminal && !process.env.CYPRESS_INTERNAL_FORCE_FILEWATCH) {
    // dont ever watch for file changes
    config.watchForFileChanges = false

    // and forcibly reset numTestsKeptInMemory
    // to zero
    config.numTestsKeptInMemory = 0
  }

  config = setResolvedConfigValues(config, defaultsForRuntime, resolved)

  if (config.port) {
    config = setUrls(config)
  }

  // validate config again here so that we catch configuration errors coming
  // from the CLI overrides or env var overrides
  validate(_.omit(config, 'browsers'), (validationResult: ConfigValidationFailureInfo | string) => {
    // return errors.throwErr('CONFIG_VALIDATION_ERROR', errMsg)
    if (_.isString(validationResult)) {
      return errors.throwErr('CONFIG_VALIDATION_MSG_ERROR', null, null, validationResult)
    }

    return errors.throwErr('CONFIG_VALIDATION_ERROR', null, null, validationResult)
  })

  config = setAbsolutePaths(config)

  config = setNodeBinary(config, options.userNodePath, options.userNodeVersion)

  debug('validate that there is no breaking config options before setupNodeEvents')

  const { testingType } = options

  function makeConfigError (cyError: CypressError) {
    cyError.name = `Obsolete option used in config object`

    return cyError
  }

  validateNoBreakingConfig(config[testingType], errors.warning, (err, options) => {
    throw makeConfigError(errors.get(err, { ...options, name: `${testingType}.${options.name}` }))
  }, testingType)

  validateNoBreakingConfig(config, errors.warning, (err, ...args) => {
    throw makeConfigError(errors.get(err, ...args))
  }, testingType)

  // We need to remove the nested propertied by testing type because it has been
  // flattened/compacted based on the current testing type that is selected
  // making the config only available with the properties that are valid,
  // also, having the correct values that can be used in the setupNodeEvents
  delete config['e2e']
  delete config['component']
  delete config['resolved']['e2e']
  delete config['resolved']['component']

  return setSupportFileAndFolder(config)
}

function setResolvedConfigValues (config, defaults, resolved) {
  const obj = _.clone(config)

  obj.resolved = resolveConfigValues(config, defaults, resolved)
  debug('resolved config is %o', obj.resolved.browsers)

  return obj
}

export function updateWithPluginValues (cfg, overrides, testingType: TestingType) {
  if (!overrides) {
    overrides = {}
  }

  debug('updateWithPluginValues %o', { cfg, overrides })

  // make sure every option returned from the plugins file
  // passes our validation functions
  validate(overrides, (validationResult: ConfigValidationFailureInfo | string) => {
    let configFile = getCtx().lifecycleManager.configFile

    if (_.isString(validationResult)) {
      return errors.throwErr('CONFIG_VALIDATION_MSG_ERROR', 'configFile', configFile, validationResult)
    }

    return errors.throwErr('CONFIG_VALIDATION_ERROR', 'configFile', configFile, validationResult)
  })

  debug('validate that there is no breaking config options added by setupNodeEvents')

  function makeSetupError (cyError: CypressError) {
    cyError.name = `Error running ${testingType}.setupNodeEvents()`

    return cyError
  }

  validateNoBreakingConfig(overrides, errors.warning, (err, options) => {
    throw makeSetupError(errors.get(err, options))
  }, testingType)

  validateNoBreakingConfig(overrides[testingType], errors.warning, (err, options) => {
    throw makeSetupError(errors.get(err, {
      ...options,
      name: `${testingType}.${options.name}`,
    }))
  }, testingType)

  const originalResolvedBrowsers = _.cloneDeep(cfg?.resolved?.browsers) ?? {
    value: cfg.browsers,
    from: 'default',
  } as ResolvedFromConfig

  const diffs = deepDiff(cfg, overrides, true)

  debug('config diffs %o', diffs)

  const userBrowserList = diffs && diffs.browsers && _.cloneDeep(diffs.browsers)

  if (userBrowserList) {
    debug('user browser list %o', userBrowserList)
  }

  // for each override go through
  // and change the resolved values of cfg
  // to point to the plugin
  if (diffs) {
    debug('resolved config before diffs %o', cfg.resolved)
    setPluginResolvedOn(cfg.resolved, diffs)
    debug('resolved config object %o', cfg.resolved)
  }

  // merge cfg into overrides
  const merged = _.defaultsDeep(diffs, cfg)

  debug('merged config object %o', merged)

  // the above _.defaultsDeep combines arrays,
  // if diffs.browsers = [1] and cfg.browsers = [1, 2]
  // then the merged result merged.browsers = [1, 2]
  // which is NOT what we want
  if (Array.isArray(userBrowserList) && userBrowserList.length) {
    merged.browsers = userBrowserList
    merged.resolved.browsers.value = userBrowserList
  }

  if (overrides.browsers === null) {
    // null breaks everything when merging lists
    debug('replacing null browsers with original list %o', originalResolvedBrowsers)
    merged.browsers = cfg.browsers
    if (originalResolvedBrowsers) {
      merged.resolved.browsers = originalResolvedBrowsers
    }
  }

  debug('merged plugins config %o', merged)

  return merged
}

// instead of the built-in Node process, specify a path to 3rd party Node
export const setNodeBinary = (obj, userNodePath, userNodeVersion) => {
  // if execPath isn't found we weren't executed from the CLI and should used the bundled node version.
  if (userNodePath && userNodeVersion && obj.nodeVersion !== 'bundled') {
    obj.resolvedNodePath = userNodePath
    obj.resolvedNodeVersion = userNodeVersion

    return obj
  }

  obj.resolvedNodeVersion = process.versions.node

  return obj
}

export function relativeToProjectRoot (projectRoot: string, file: string) {
  if (!file.startsWith(projectRoot)) {
    return file
  }

  // captures leading slash(es), both forward slash and back slash
  const leadingSlashRe = /^[\/|\\]*(?![\/|\\])/

  return file.replace(projectRoot, '').replace(leadingSlashRe, '')
}

// async function
export async function setSupportFileAndFolder (obj) {
  if (!obj.supportFile) {
    return Bluebird.resolve(obj)
  }

  obj = _.clone(obj)

  const ctx = getCtx()

  const supportFilesByGlob = await ctx.file.getFilesByGlob(obj.projectRoot, obj.supportFile)

  if (supportFilesByGlob.length > 1) {
    return errors.throwErr('MULTIPLE_SUPPORT_FILES_FOUND', obj.supportFile, supportFilesByGlob)
  }

  if (supportFilesByGlob.length === 0) {
    if (obj.resolved.supportFile.from === 'default') {
      return errors.throwErr('DEFAULT_SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, obj.supportFile))
    }

    return errors.throwErr('SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, obj.supportFile))
  }

  // TODO move this logic to find support file into util/path_helpers
  const sf = supportFilesByGlob[0]

  debug(`setting support file ${sf}`)
  debug(`for project root ${obj.projectRoot}`)

  return Bluebird
  .try(() => {
    // resolve full path with extension
    obj.supportFile = utils.resolveModule(sf)

    return debug('resolved support file %s', obj.supportFile)
  }).then(() => {
    if (!checkIfResolveChangedRootFolder(obj.supportFile, sf)) {
      return
    }

    debug('require.resolve switched support folder from %s to %s', sf, obj.supportFile)
    // this means the path was probably symlinked, like
    // /tmp/foo -> /private/tmp/foo
    // which can confuse the rest of the code
    // switch it back to "normal" file
    const supportFileName = path.basename(obj.supportFile)
    const base = sf?.endsWith(supportFileName) ? path.dirname(sf) : sf

    obj.supportFile = path.join(base || '', supportFileName)

    return fs.pathExists(obj.supportFile)
    .then((found) => {
      if (!found) {
        errors.throwErr('SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, obj.supportFile))
      }

      return debug('switching to found file %s', obj.supportFile)
    })
  }).catch({ code: 'MODULE_NOT_FOUND' }, () => {
    debug('support JS module %s does not load', sf)

    return utils.discoverModuleFile({
      filename: sf,
      projectRoot: obj.projectRoot,
    })
    .then((result) => {
      if (result === null) {
        return errors.throwErr('SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, sf))
      }

      debug('setting support file to %o', { result })
      obj.supportFile = result

      return obj
    })
  })
  .then(() => {
    if (obj.supportFile) {
      // set config.supportFolder to its directory
      obj.supportFolder = path.dirname(obj.supportFile)
      debug(`set support folder ${obj.supportFolder}`)
    }

    return obj
  })
}

export function setAbsolutePaths (obj) {
  let pr

  obj = _.clone(obj)

  // if we have a projectRoot
  pr = obj.projectRoot

  if (pr) {
    // reset fileServerFolder to be absolute
    // obj.fileServerFolder = path.resolve(pr, obj.fileServerFolder)

    // and do the same for all the rest
    _.extend(obj, convertRelativeToAbsolutePaths(pr, obj))
  }

  return obj
}

export function setUrls (obj) {
  obj = _.clone(obj)

  // TODO: rename this to be proxyServer
  const proxyUrl = `http://localhost:${obj.port}`

  const rootUrl = obj.baseUrl
    ? uri.origin(obj.baseUrl)
    : proxyUrl

  _.extend(obj, {
    proxyUrl,
    browserUrl: rootUrl + obj.clientRoute,
    reporterUrl: rootUrl + obj.reporterRoute,
    xhrUrl: obj.namespace + obj.xhrRoute,
  })

  return obj
}
