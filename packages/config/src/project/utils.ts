import Debug from 'debug'
import fs from 'fs-extra'
import _ from 'lodash'
import path from 'path'

import type {
  ResolvedFromConfig,
  ResolvedConfigurationOptionSource,
} from '@packages/types'
import errors, { ConfigValidationFailureInfo, CypressError } from '@packages/errors'

import type { Config } from './types'

import {
  allowed,
  getDefaultValues,
  matchesConfigKey,
  getPublicConfigKeys,
  validate,
  validateNoBreakingConfig,
} from '../browser'
import { hideKeys, setUrls, coerce } from '../utils'
import { options } from '../options'
import { isPlainObject } from '../validation'

const debug = Debug('cypress:config:project:utils')

const hideSpecialVals = function (val: string, key: string) {
  if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
    return hideKeys(val)
  }

  return val
}

export function getProcessEnvVars (obj: NodeJS.ProcessEnv) {
  return _.reduce(obj, (memo: Record<string, string>, value: string | undefined, key: string) => {
    if (!value) {
      return memo
    }

    if (isCypressEnvLike(key)) {
      memo[removeEnvPrefix(key)] = coerce(value)
    }

    return memo
  }, {})
}

export function resolveModule (name: string) {
  return require.resolve(name)
}

// returns:
//   false - if the file should not be set
//   string - found filename
//   null - if there is an error finding the file
function discoverModuleFile (options: {
  filename: string
  projectRoot: string
}) {
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
}

const CYPRESS_ENV_PREFIX = 'CYPRESS_'

const CYPRESS_ENV_PREFIX_LENGTH = CYPRESS_ENV_PREFIX.length

const CYPRESS_RESERVED_ENV_VARS = [
  'CYPRESS_INTERNAL_ENV',
]

const CYPRESS_SPECIAL_ENV_VARS = [
  'RECORD_KEY',
]

// CYPRESS_env and CYPRESS_expose must be JSON objects. Invalid strings are coerced
// then spread via _.extend, producing indexed keys that pass isPlainObject validation.
const PLAIN_OBJECT_CONFIG_KEYS_FROM_ENV = new Set(['env', 'expose'])

const isCypressEnvLike = (key: string) => {
  return _.chain(key)
  .invoke('toUpperCase')
  .startsWith(CYPRESS_ENV_PREFIX)
  .value() &&
  !_.includes(CYPRESS_RESERVED_ENV_VARS, key)
}

const removeEnvPrefix = (key: string) => {
  return key.slice(CYPRESS_ENV_PREFIX_LENGTH)
}

export function parseEnv (cfg: Record<string, any>, cliEnvs: Record<string, any>, resolved: Record<string, any> = {}) {
  const envVars: any = (resolved.env = {})

  const resolveFrom = (from: string, obj = {}) => {
    return _.each(obj, (val, key) => {
      return envVars[key] = {
        value: val,
        from,
      }
    })
  }

  const configEnv = cfg.env != null ? cfg.env : {}
  const envFile = cfg.envFile != null ? cfg.envFile : {}

  let processEnvs = getProcessEnvVars(process.env) || {}

  cliEnvs = cliEnvs != null ? cliEnvs : {}

  const configFromEnv = _.reduce(processEnvs, (memo: string[], val, key) => {
    const cfgKey = matchesConfigKey(key)

    if (cfgKey) {
      if (PLAIN_OBJECT_CONFIG_KEYS_FROM_ENV.has(cfgKey)) {
        const validationResult = isPlainObject(cfgKey, val)

        if (validationResult !== true) {
          errors.warning('INVALID_CYPRESS_ENV_OVERRIDE', cfgKey, val)
          memo.push(key)

          return memo
        }
      }

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
  }, [])

  processEnvs = _.chain(processEnvs)
  .omit(configFromEnv)
  .mapValues(hideSpecialVals)
  .value()

  resolveFrom('config', configEnv)
  resolveFrom('envFile', envFile)
  resolveFrom('env', processEnvs)
  resolveFrom('cli', cliEnvs)

  // configEnvs is from cypress.config.{js,ts,mjs,cjs}
  // envFile is from cypress.env.json
  // processEnvs is from process env vars
  // cliEnvs is from CLI arguments
  return _.extend(configEnv, envFile, processEnvs, cliEnvs)
}

function parseExposed (cfg: Record<string, any>, cliExposeVars: Record<string, any>, resolved: Record<string, any> = {}) {
  const exposeVars: any = (resolved.expose = {})

  const resolveFrom = (from: string, obj = {}) => {
    return _.each(obj, (val, key) => {
      return exposeVars[key] = {
        value: val,
        from,
      }
    })
  }

  const configExpose = cfg.expose != null ? cfg.expose : {}

  cliExposeVars = cliExposeVars != null ? cliExposeVars : {}

  resolveFrom('config', configExpose)
  resolveFrom('cli', cliExposeVars)

  // configExpose is from cypress.config.{js,ts,mjs,cjs}
  // cliExposedVars is from CLI arguments
  return _.extend(configExpose, cliExposeVars)
}

// combines the default configuration object with values specified in the
// configuration file like "cypress.{ts|js}". Values in configuration file
// overwrite the defaults.
export function resolveConfigValues (config: Config, defaults: Record<string, any>, resolved: any = {}) {
  // pick out only known configuration keys
  return _
  .chain(config)
  .pick(getPublicConfigKeys())
  .mapValues((val, key) => {
    const source = (s: ResolvedConfigurationOptionSource): ResolvedFromConfig => {
      return {
        value: val,
        from: s,
      }
    }

    const r = resolved[key]

    if (r) {
      if (_.isObject(r)) {
        return r
      }

      return source(r)
    }

    if (_.isEqual(config[key], defaults[key]) || key === 'browsers') {
      // "browsers" list is special, since it is dynamic by default
      // and can only be overwritten via plugins file
      return source('default')
    }

    return source('config')
  })
  .value()
}

// Given an object "resolvedObj" and a list of overrides in "obj"
// marks all properties from "obj" inside "resolvedObj" using
// {value: obj.val, from: "plugin"}
export function setPluginResolvedOn (resolvedObj: Record<string, any>, obj: Record<string, any>): any {
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

export function setAbsolutePaths (obj: Config) {
  obj = _.clone(obj)

  // if we have a projectRoot
  const pr = obj.projectRoot

  if (pr) {
    // reset fileServerFolder to be absolute
    // obj.fileServerFolder = path.resolve(pr, obj.fileServerFolder)

    // and do the same for all the rest
    _.extend(obj, convertRelativeToAbsolutePaths(pr, obj))
  }

  return obj
}

const folders = _(options).filter({ isFolder: true }).map('name').value()

const convertRelativeToAbsolutePaths = (projectRoot: string, obj: Config) => {
  return _.reduce(folders, (memo: Record<string, string>, folder) => {
    const val = obj[folder]

    if ((val != null) && (val !== false)) {
      memo[folder] = path.resolve(projectRoot, val)
    }

    return memo
  }, {})
}

// instead of the built-in Node process, specify a path to 3rd party Node
export const setNodeBinary = (obj: Config, userNodePath?: string, userNodeVersion?: string) => {
  // if execPath isn't found we weren't executed from the CLI and should used the bundled node version.
  if (userNodePath && userNodeVersion) {
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
export async function setSupportFileAndFolder (obj: Config, getFilesByGlob: any) {
  if (!obj.supportFile) {
    return Promise.resolve(obj)
  }

  obj = _.clone(obj)

  const supportFilesByGlob = await getFilesByGlob(obj.projectRoot, obj.supportFile)

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
  const originalSupportFilePath: string = supportFilesByGlob[0]!

  debug('setting support file %s for project root %s', originalSupportFilePath, obj.projectRoot)

  let resolvedPath: string

  try {
    resolvedPath = resolveModule(originalSupportFilePath)
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException

    if (error.code === 'MODULE_NOT_FOUND') {
      debug('support JS module %s does not load', originalSupportFilePath)

      const discoveredPath = await discoverModuleFile({
        filename: originalSupportFilePath,
        projectRoot: obj.projectRoot,
      })

      if (discoveredPath === null) {
        return errors.throwErr('SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, originalSupportFilePath))
      }

      debug('setting support file to %o', { discoveredPath })
      obj.supportFile = discoveredPath
      obj.supportFolder = path.dirname(obj.supportFile)
      debug('set support folder %s', obj.supportFolder)

      return obj
    }

    throw err
  }

  obj.supportFile = resolvedPath
  debug('resolved support file %s', obj.supportFile)

  // Handle symlink resolution: require.resolve may follow symlinks (e.g., /tmp/foo -> /private/tmp/foo on macOS)
  // which can confuse the rest of the code. Switch back to the original path if it changed.
  if (checkIfResolveChangedRootFolder(obj.supportFile, originalSupportFilePath)) {
    debug('require.resolve switched support folder from %s to %s', originalSupportFilePath, obj.supportFile)

    const correctedPath = correctSymlinkedPath(obj.supportFile, originalSupportFilePath)

    const found = await fs.pathExists(correctedPath)

    if (!found) {
      errors.throwErr('SUPPORT_FILE_NOT_FOUND', relativeToProjectRoot(obj.projectRoot, correctedPath))
    }

    obj.supportFile = correctedPath
    debug('switched to corrected file path %s', obj.supportFile)
  }

  obj.supportFolder = path.dirname(obj.supportFile)
  debug('set support folder %s', obj.supportFolder)

  return obj
}

export function mergeDefaults (
  config: Config = {},
  options: Record<string, any> = {},
  cliConfig: Record<string, any> = {},
  getFilesByGlob: any,
) {
  const resolved: any = {}
  const { testingType } = options

  config.rawJson = _.cloneDeep(config)

  _.extend(config, _.pick(options, 'configFile', 'morgan', 'isTextTerminal', 'socketId', 'report', 'browsers'))
  debug('merged config with options, got %o', config)

  _
  .chain(allowed({ ...cliConfig, ...options }))
  .omit('env')
  .omit('expose')
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

  const defaultsForRuntime = getDefaultValues({
    ...options,
  })

  _.defaultsDeep(config, defaultsForRuntime)

  let additionalIgnorePattern = config.additionalIgnorePattern

  if (testingType === 'component' && config.e2e && config.e2e.specPattern) {
    additionalIgnorePattern = config.e2e.specPattern
  }

  config = {
    ...config,
    ...config[testingType],
    additionalIgnorePattern,
  }

  // we want the allowCypressEnv option to be inherited by e2e/component config when evaluating
  // breaking options in order to correctly hide the error that Cypress.env() is deprecated when allowCypressEnv is false
  // unless the value is explicitly set
  config.allowCypressEnv = config.allowCypressEnv ?? true
  if (!_.has(config[testingType], 'allowCypressEnv') && _.isObject(config[testingType])) {
    config[testingType].allowCypressEnv = config.allowCypressEnv
  }

  // split out our own app wide env from user env variables
  // and delete envFile
  config.env = parseEnv(config, { ...cliConfig.env, ...options.env }, resolved)

  config.expose = parseExposed(config, { ...cliConfig.expose, ...options.expose }, resolved)

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
  }, testingType)

  config = setAbsolutePaths(config)

  config = setNodeBinary(config, options.userNodePath, options.userNodeVersion)

  debug('validate that there is no breaking config options before setupNodeEvents')

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

  return setSupportFileAndFolder(config, getFilesByGlob)
}

function isValidCypressInternalEnvValue (value: string) {
  // names of config environments, see "config/app.json"
  const names = ['development', 'test', 'staging', 'production']

  return _.includes(names, value)
}

function setResolvedConfigValues (config: Config, defaults: any, resolved: any) {
  const obj = _.clone(config)

  obj.resolved = resolveConfigValues(config, defaults, resolved)
  debug('resolved config is %o', obj.resolved.browsers)

  return obj
}

// require.resolve walks the symlinks, which can really change
// the results. For example
//  /tmp/foo is symlink to /private/tmp/foo on Mac
// thus resolving /tmp/foo to find /tmp/foo/index.js
// can return /private/tmp/foo/index.js
// which can really confuse the rest of the code.
// Detect this switch by checking if the resolution of absolute
// paths moved the prefix
//
// Good case: no switcheroo, return false
//   /foo/bar -> /foo/bar/index.js
// Bad case: return true
//   /tmp/foo/bar -> /private/tmp/foo/bar/index.js
export const checkIfResolveChangedRootFolder = (resolved: string, initial: string) => {
  return path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)
}

export function correctSymlinkedPath (resolvedPath: string, originalPath: string): string {
  const fileName = path.basename(resolvedPath)

  // If the original path ends with the filename, use its directory
  // Otherwise, use the original path as-is (it might be a directory)
  const basePath = originalPath.endsWith(fileName) ? path.dirname(originalPath) : originalPath

  return path.join(basePath, fileName)
}
