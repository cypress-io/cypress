import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import path from 'path'
import deepDiff from 'return-deep-diff'
import type { ResolvedFromConfig, ResolvedConfigurationOptionSource, TestingType } from '@packages/types'
import * as configUtils from '@packages/config'
import * as errors from './errors'
import { getProcessEnvVars, CYPRESS_SPECIAL_ENV_VARS } from './util/config'
import { fs } from './util/fs'
import keys from './util/keys'
import origin from './util/origin'
import pathHelpers from './util/path_helpers'

import type { ConfigValidationFailureInfo, CypressError } from '@packages/errors'

import { getCtx } from './makeDataContext'

const debug = Debug('cypress:server:config')

const folders = _(configUtils.options).filter({ isFolder: true }).map('name').value()

const convertRelativeToAbsolutePaths = (projectRoot, obj) => {
  return _.reduce(folders, (memo, folder) => {
    const val = obj[folder]

    if ((val != null) && (val !== false)) {
      memo[folder] = path.resolve(projectRoot, val)
    }

    return memo
  }
  , {})
}

const hideSpecialVals = function (val, key) {
  if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
    return keys.hide(val)
  }

  return val
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

export function isValidCypressInternalEnvValue (value) {
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
  const resolved = {}

  config.rawJson = _.cloneDeep(config)

  _.extend(config, _.pick(options, 'configFile', 'morgan', 'isTextTerminal', 'socketId', 'report', 'browsers'))
  debug('merged config with options, got %o', config)

  _
  .chain(configUtils.allowed({ ...cliConfig, ...options }))
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

  const defaultsForRuntime = configUtils.getDefaultValues(options)

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
  configUtils.validate(_.omit(config, 'browsers'), (validationResult: ConfigValidationFailureInfo | string) => {
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

  configUtils.validateNoBreakingConfig(config[testingType], errors.warning, (err, options) => {
    throw makeConfigError(errors.get(err, { ...options, name: `${testingType}.${options.name}` }))
  }, testingType)

  configUtils.validateNoBreakingConfig(config, errors.warning, (err, ...args) => {
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

export function setResolvedConfigValues (config, defaults, resolved) {
  const obj = _.clone(config)

  obj.resolved = resolveConfigValues(config, defaults, resolved)
  debug('resolved config is %o', obj.resolved.browsers)

  return obj
}

// Given an object "resolvedObj" and a list of overrides in "obj"
// marks all properties from "obj" inside "resolvedObj" using
// {value: obj.val, from: "plugin"}
export function setPluginResolvedOn (resolvedObj: Record<string, any>, obj: Record<string, any>) {
  return _.each(obj, (val, key) => {
    if (_.isObject(val) && !_.isArray(val) && resolvedObj[key]) {
      // recurse setting overrides
      // inside of objected
      return setPluginResolvedOn(resolvedObj[key], val)
    }

    const valueFrom: ResolvedFromConfig = {
      value: val,
      from: 'plugin',
    }

    resolvedObj[key] = valueFrom
  })
}

export function updateWithPluginValues (cfg, overrides, testingType: TestingType) {
  if (!overrides) {
    overrides = {}
  }

  debug('updateWithPluginValues %o', { cfg, overrides })

  // make sure every option returned from the plugins file
  // passes our validation functions
  configUtils.validate(overrides, (validationResult: ConfigValidationFailureInfo | string) => {
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

  configUtils.validateNoBreakingConfig(overrides, errors.warning, (err, options) => {
    throw makeSetupError(errors.get(err, options))
  }, testingType)

  configUtils.validateNoBreakingConfig(overrides[testingType], errors.warning, (err, options) => {
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

// combines the default configuration object with values specified in the
// configuration file like "cypress.{ts|js}". Values in configuration file
// overwrite the defaults.
export function resolveConfigValues (config, defaults, resolved = {}) {
  // pick out only known configuration keys
  return _
  .chain(config)
  .pick(configUtils.getPublicConfigKeys())
  .mapValues((val, key) => {
    let r
    const source = (s: ResolvedConfigurationOptionSource): ResolvedFromConfig => {
      return {
        value: val,
        from: s,
      }
    }

    r = resolved[key]

    if (r) {
      if (_.isObject(r)) {
        return r
      }

      return source(r)
    }

    if (!(!_.isEqual(config[key], defaults[key]) && key !== 'browsers')) {
      // "browsers" list is special, since it is dynamic by default
      // and can only be overwritten via plugins file
      return source('default')
    }

    return source('config')
  }).value()
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
    if (!pathHelpers.checkIfResolveChangedRootFolder(obj.supportFile, sf)) {
      return
    }

    debug('require.resolve switched support folder from %s to %s', sf, obj.supportFile)
    // this means the path was probably symlinked, like
    // /tmp/foo -> /private/tmp/foo
    // which can confuse the rest of the code
    // switch it back to "normal" file
    const supportFileName = path.basename(obj.supportFile)
    const base = sf.endsWith(supportFileName) ? path.dirname(sf) : sf

    obj.supportFile = path.join(base, supportFileName)

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

  const rootUrl = obj.baseUrl ?
    origin(obj.baseUrl)
    :
    proxyUrl

  _.extend(obj, {
    proxyUrl,
    browserUrl: rootUrl + obj.clientRoute,
    reporterUrl: rootUrl + obj.reporterRoute,
    xhrUrl: obj.namespace + obj.xhrRoute,
  })

  return obj
}

export function parseEnv (cfg: Record<string, any>, envCLI: Record<string, any>, resolved: Record<string, any> = {}) {
  const envVars = (resolved.env = {})

  const resolveFrom = (from, obj = {}) => {
    return _.each(obj, (val, key) => {
      return envVars[key] = {
        value: val,
        from,
      }
    })
  }

  const envCfg = cfg.env != null ? cfg.env : {}
  const envFile = cfg.envFile != null ? cfg.envFile : {}
  let envProc = getProcessEnvVars(process.env) || {}

  envCLI = envCLI != null ? envCLI : {}

  const configFromEnv = _.reduce(envProc, (memo: string[], val, key) => {
    const cfgKey = configUtils.matchesConfigKey(key)

    if (cfgKey) {
      // only change the value if it hasn't been
      // set by the CLI. override default + config
      if (resolved[cfgKey] !== 'cli') {
        cfg[cfgKey] = val
        resolved[cfgKey] = {
          value: val,
          from: 'env',
        } as ResolvedFromConfig
      }

      memo.push(key)
    }

    return memo
  }
  , [])

  envProc = _.chain(envProc)
  .omit(configFromEnv)
  .mapValues(hideSpecialVals)
  .value()

  resolveFrom('config', envCfg)
  resolveFrom('envFile', envFile)
  resolveFrom('env', envProc)
  resolveFrom('cli', envCLI)

  // envCfg is from cypress.config.{js,ts,mjs,cjs}
  // envFile is from cypress.env.json
  // envProc is from process env vars
  // envCLI is from CLI arguments
  return _.extend(envCfg, envFile, envProc, envCLI)
}

export function getResolvedRuntimeConfig (config, runtimeConfig) {
  const resolvedRuntimeFields = _.mapValues(runtimeConfig, (v): ResolvedFromConfig => ({ value: v, from: 'runtime' }))

  return {
    ...config,
    ...runtimeConfig,
    resolved: { ...config.resolved, ...resolvedRuntimeFields },
  }
}
