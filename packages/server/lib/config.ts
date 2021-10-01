import _ from 'lodash'
import R from 'ramda'
import path from 'path'
import Promise from 'bluebird'
import deepDiff from 'return-deep-diff'

import errors from './errors'
import scaffold from './scaffold'
import { fs } from './util/fs'
import keys from './util/keys'
import origin from './util/origin'
import * as settings from './util/settings'
import Debug from 'debug'
import pathHelpers from './util/path_helpers'
import findSystemNode from './util/find_system_node'

const debug = Debug('cypress:server:config')

import { options, breakingOptions } from './config_options'
import { getProcessEnvVars } from './util/config'

export const RESOLVED_FROM = ['plugin', 'env', 'default', 'runtime', 'config'] as const

export type ResolvedConfigurationOptionSource = typeof RESOLVED_FROM[number]

export type ResolvedFromConfig = {
  from: ResolvedConfigurationOptionSource
  value: ResolvedConfigurationOptionSource
}

export type ResolvedConfigurationOptions = Partial<{
  [x in keyof Cypress.ResolvedConfigOptions]: ResolvedFromConfig
}>

export const CYPRESS_ENV_PREFIX = 'CYPRESS_'

export const CYPRESS_ENV_PREFIX_LENGTH = 'CYPRESS_'.length

export const CYPRESS_RESERVED_ENV_VARS = [
  'CYPRESS_INTERNAL_ENV',
]

export const CYPRESS_SPECIAL_ENV_VARS = [
  'RECORD_KEY',
]

const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
const createIndex = (arr, keyKey, valueKey) => {
  return _.reduce(arr, (memo, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey]] = item[valueKey]
    }

    return memo
  }, {})
}

const publicConfigKeys = _(options).reject({ isInternal: true }).map('name').value()
const breakingKeys = _.map(breakingOptions, 'name')
const folders = _(options).filter({ isFolder: true }).map('name').value()
const validationRules = createIndex(options, 'name', 'validation')
const defaultValues: Record<string, any> = createIndex(options, 'name', 'defaultValue')
const onlyInOverrideValues = createIndex(options, 'name', 'onlyInOverride')

const convertRelativeToAbsolutePaths = (projectRoot, obj, defaults = {}) => {
  return _.reduce(folders, (memo, folder) => {
    const val = obj[folder]

    if ((val != null) && (val !== false)) {
      memo[folder] = path.resolve(projectRoot, val)
    }

    return memo
  }
  , {})
}

const validateNoBreakingConfig = (cfg) => {
  return _.each(breakingOptions, ({ name, errorKey, newName, isWarning }) => {
    if (_.has(cfg, name)) {
      if (isWarning) {
        return errors.warning(errorKey, name, newName)
      }

      return errors.throw(errorKey, name, newName)
    }
  })
}

/**
 * validate a root config object
 * @param {object} cfg config object to validate
 * @param {(errMsg:string) => void} onErr function run when invalid config is found
 * @param {boolean} bypassRootLimitations skip checks related to position when we are working with merged configs
 * @returns
 */
function validate (cfg, onErr,
  { bypassRootLimitations } = { bypassRootLimitations: false }) {
  return _.each(cfg, (value, key) => {
    const validationFn = validationRules[key]

    if (!bypassRootLimitations && onlyInOverrideValues[key]) {
      if (onlyInOverrideValues[key] === true) {
        return onErr(`key \`${key}\` is only valid in a testingType object, it is invalid to use it in the root`)
      }

      return onErr(`key \`${key}\` is only valid in the \`${onlyInOverrideValues[key]}\` object, it is invalid to use it in the root`)
    }

    // does this key have a validation rule?
    if (validationFn) {
      // and is the value different from the default?
      if (value !== defaultValues[key]) {
        const result = validationFn(key, value)

        if (result !== true) {
          return onErr(result)
        }
      }
    }
  })
}

const validateFile = (file) => {
  return (configObject) => {
    // disallow use of pluginFile in evaluated configuration files
    if (/\.(ts|js)$/.test(file) && configObject.pluginsFile) {
      errors.throw('CONFLICT_PLUGINSFILE_CONFIGJS', file)
    }

    return validate(configObject, (errMsg) => {
      return errors.throw('SETTINGS_VALIDATION_ERROR', file, errMsg)
    })
  }
}

const hideSpecialVals = function (val, key) {
  if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
    return keys.hide(val)
  }

  return val
}

function isComponentTesting (options: Record<string, string> = {}) {
  return options.testingType === 'component'
}

// an object with a few utility methods
// for easy stubbing from unit tests
export const utils = {
  resolveModule (name) {
    return require.resolve(name)
  },

  // tries to find support or plugins file
  // returns:
  //   false - if the file should not be set
  //   string - found filename
  //   null - if there is an error finding the file
  discoverModuleFile (options) {
    debug('discover module file %o', options)
    const { filename, isDefault } = options

    if (!isDefault) {
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

    // support or plugins file doesn't exist on disk?
    debug(`support file is default, check if ${path.dirname(filename)} exists`)

    return fs.pathExists(filename)
    .then((found) => {
      if (found) {
        debug('is there index.ts in the support or plugins folder %s?', filename)
        const tsFilename = path.join(filename, 'index.ts')

        return fs.pathExists(tsFilename)
        .then((foundTsFile) => {
          if (foundTsFile) {
            debug('found index TS file %s', tsFilename)

            return tsFilename
          }

          // if the directory exists, set it to false so it's ignored
          debug('setting support or plugins file to false')

          return false
        })
      }

      debug('folder does not exist, set to default index.js')

      // otherwise, set it up to be scaffolded later
      return path.join(filename, 'index.js')
    })
  },
}

export function getConfigKeys () {
  return publicConfigKeys
}

export function isValidCypressInternalEnvValue (value) {
  // names of config environments, see "config/app.yml"
  const names = ['development', 'test', 'staging', 'production']

  return _.includes(names, value)
}

export function allowed (obj = {}) {
  const propertyNames = publicConfigKeys.concat(breakingKeys)

  return _.pick(obj, propertyNames)
}

export function get (projectRoot, options = {}) {
  const configFilename = settings.configFile(projectRoot, options)

  return Promise.all([
    settings.read(projectRoot, options).then(validateFile(configFilename)),
    settings.readEnv(projectRoot).then(validateFile('cypress.env.json')),
  ])
  .spread((configObject, envFile) => {
    return set({
      projectName: getNameFromRoot(projectRoot),
      projectRoot,
      config: _.cloneDeep(configObject),
      envFile: _.cloneDeep(envFile),
      options,
    })
  })
}

export function set (obj: Record<string, any> = {}) {
  debug('setting config object')
  let { projectRoot, projectName, config, envFile, options } = obj

  // just force config to be an object
  // so we dont have to do as much
  // work in our tests
  if (config == null) {
    config = {}
  }

  debug('config is %o', config)

  // flatten the object's properties
  // into the master config object
  config.envFile = envFile
  config.projectRoot = projectRoot
  config.projectName = projectName

  return mergeAllConfigs(config, options).then((configObject = {}) => {
    debug('merged config is %o', configObject)

    return configObject
  })
}

function mergeCLIOptions (config, options) {
  const resolved = {}

  config.rawJson = _.cloneDeep(config)

  _.extend(config, _.pick(options, 'configFile', 'morgan', 'isTextTerminal', 'socketId', 'report', 'browsers', 'testingType'))
  debug('merged config with options, got %o', config)

  _
  .chain(allowed(options))
  .omit('env')
  .omit('browsers')
  .each((val, key) => {
    resolved[key] = 'cli'
    config[key] = val
  }).value()

  return resolved
}

function cleanUpConfig (config, options, resolved) {
  let url = config.baseUrl

  if (url) {
    // replace multiple slashes at the end of string to single slash
    // so http://localhost/// will be http://localhost/
    // https://regexr.com/48rvt
    config.baseUrl = url.replace(/\/\/+$/, '/')
  }

  // split out our own app wide env from user env variables
  // and delete envFile
  config.env = parseEnv(config, options.env, resolved)

  config.cypressEnv = process.env['CYPRESS_INTERNAL_ENV']
  debug('using CYPRESS_INTERNAL_ENV %s', config.cypressEnv)
  if (!isValidCypressInternalEnvValue(config.cypressEnv)) {
    errors.throw('INVALID_CYPRESS_INTERNAL_ENV', config.cypressEnv)
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
}

export function mergeAllConfigs (config: Record<string, any> = {}, options: Record<string, any> = {}) {
  const resolved = mergeCLIOptions(config, options)

  cleanUpConfig(config, options, resolved)

  validate(config, (errMsg) => {
    return errors.throw('CONFIG_VALIDATION_ERROR', errMsg)
  })

  const testingType = isComponentTesting(options) ? 'component' : 'e2e'

  if (testingType in config) {
    config = { ...config, ...config[testingType] }
  }

  // 3 - merge the defaults
  _.defaults(config, defaultValues)

  config = setResolvedConfigValues(config, defaultValues, resolved)

  if (config.port) {
    config = setUrls(config)
  }

  config = setAbsolutePaths(config, defaultValues)

  config = setParentTestsPaths(config)

  validateNoBreakingConfig(config)

  return setSupportFileAndFolder(config)
  .then(setPluginsFile)
  .then(setScaffoldPaths)
  .then(_.partialRight(setNodeBinary, options.onWarning))
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

export function updateWithPluginValues (cfg, overrides) {
  if (!overrides) {
    overrides = {}
  }

  debug('updateWithPluginValues %o', { cfg, overrides })

  // make sure every option returned from the plugins file
  // passes our validation functions
  validate(overrides, (errMsg) => {
    if (cfg.pluginsFile && cfg.projectRoot) {
      const relativePluginsPath = path.relative(cfg.projectRoot, cfg.pluginsFile)

      return errors.throw('PLUGINS_CONFIG_VALIDATION_ERROR', relativePluginsPath, errMsg)
    }

    return errors.throw('CONFIG_VALIDATION_ERROR', errMsg)
  })

  let originalResolvedBrowsers = cfg && cfg.resolved && cfg.resolved.browsers && R.clone(cfg.resolved.browsers)

  if (!originalResolvedBrowsers) {
    // have something to resolve with if plugins return nothing
    originalResolvedBrowsers = {
      value: cfg.browsers,
      from: 'default',
    } as ResolvedFromConfig
  }

  const diffs = deepDiff(cfg, overrides, true)

  debug('config diffs %o', diffs)

  const userBrowserList = diffs && diffs.browsers && R.clone(diffs.browsers)

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
// configuration file like "cypress.json". Values in configuration file
// overwrite the defaults.
export function resolveConfigValues (config, defaults, resolved = {}) {
  // pick out only known configuration keys
  return _
  .chain(config)
  .pick(publicConfigKeys)
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
      // and can only be ovewritten via plugins file
      return source('default')
    }

    return source('config')
  }).value()
}

// instead of the built-in Node process, specify a path to 3rd party Node
export const setNodeBinary = Promise.method((obj, onWarning) => {
  if (obj.nodeVersion !== 'system') {
    obj.resolvedNodeVersion = process.versions.node

    return obj
  }

  return findSystemNode.findNodePathAndVersion()
  .then(({ path, version }) => {
    obj.resolvedNodePath = path
    obj.resolvedNodeVersion = version
  }).catch((err) => {
    onWarning(errors.get('COULD_NOT_FIND_SYSTEM_NODE', process.versions.node))
    obj.resolvedNodeVersion = process.versions.node
  }).return(obj)
})

export function setScaffoldPaths (obj) {
  obj = _.clone(obj)

  debug('set scaffold paths')

  return scaffold.fileTree(obj)
  .then((fileTree) => {
    debug('got file tree')
    obj.scaffoldedFiles = fileTree

    return obj
  })
}

// async function
export function setSupportFileAndFolder (obj) {
  if (!obj.supportFile) {
    return Promise.resolve(obj)
  }

  obj = _.clone(obj)

  // TODO move this logic to find support file into util/path_helpers
  const sf = obj.supportFile

  debug(`setting support file ${sf}`)
  debug(`for project root ${obj.projectRoot}`)

  return Promise
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
    obj.supportFile = path.join(sf, path.basename(obj.supportFile))

    return fs.pathExists(obj.supportFile)
    .then((found) => {
      if (!found) {
        errors.throw('SUPPORT_FILE_NOT_FOUND', obj.supportFile, obj.configFile || defaultValues.configFile)
      }

      return debug('switching to found file %s', obj.supportFile)
    })
  }).catch({ code: 'MODULE_NOT_FOUND' }, () => {
    debug('support JS module %s does not load', sf)

    const loadingDefaultSupportFile = sf === path.resolve(obj.projectRoot, defaultValues.supportFile)

    return utils.discoverModuleFile({
      filename: sf,
      isDefault: loadingDefaultSupportFile,
      projectRoot: obj.projectRoot,
    })
    .then((result) => {
      if (result === null) {
        const configFile = obj.configFile || defaultValues.configFile

        return errors.throw('SUPPORT_FILE_NOT_FOUND', path.resolve(obj.projectRoot, sf), configFile)
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

// set pluginsFile to an absolute path with the following rules:
// - do nothing if pluginsFile is falsey
// - look up the absolute path via node, so 'cypress/plugins' can resolve
//   to 'cypress/plugins/index.js' or 'cypress/plugins/index.coffee'
// - if not found
//   * and the pluginsFile is set to the default
//     - and the path to the pluginsFile directory exists
//       * assume the user doesn't need a pluginsFile, set it to false
//         so it's ignored down the pipeline
//     - and the path to the pluginsFile directory does not exist
//       * set it to cypress/plugins/index.js, it will get scaffolded
//   * and the pluginsFile is NOT set to the default
//     - throw an error, because it should be there if the user
//       explicitly set it
export const setPluginsFile = Promise.method((obj) => {
  if (!obj.pluginsFile) {
    return obj
  }

  obj = _.clone(obj)

  const {
    pluginsFile,
  } = obj

  debug(`setting plugins file ${pluginsFile}`)
  debug(`for project root ${obj.projectRoot}`)

  return Promise
  .try(() => {
    // resolve full path with extension
    obj.pluginsFile = utils.resolveModule(pluginsFile)

    return debug(`set pluginsFile to ${obj.pluginsFile}`)
  }).catch({ code: 'MODULE_NOT_FOUND' }, () => {
    debug('plugins module does not exist %o', { pluginsFile })

    const isLoadingDefaultPluginsFile = pluginsFile === path.resolve(obj.projectRoot, defaultValues.pluginsFile)

    return utils.discoverModuleFile({
      filename: pluginsFile,
      isDefault: isLoadingDefaultPluginsFile,
      projectRoot: obj.projectRoot,
    })
    .then((result) => {
      if (result === null) {
        return errors.throw('PLUGINS_FILE_ERROR', path.resolve(obj.projectRoot, pluginsFile))
      }

      debug('setting plugins file to %o', { result })
      obj.pluginsFile = result

      return obj
    })
  }).return(obj)
})

export function setParentTestsPaths (obj) {
  // projectRoot:              "/path/to/project"
  // integrationFolder:        "/path/to/project/cypress/integration"
  // componentFolder:          "/path/to/project/cypress/components"
  // parentTestsFolder:        "/path/to/project/cypress"
  // parentTestsFolderDisplay: "project/cypress"

  obj = _.clone(obj)

  const ptfd = (obj.parentTestsFolder = path.dirname(obj.integrationFolder))

  const prd = path.dirname(obj.projectRoot != null ? obj.projectRoot : '')

  obj.parentTestsFolderDisplay = path.relative(prd, ptfd)

  return obj
}

export function setAbsolutePaths (obj, defaults) {
  let pr

  obj = _.clone(obj)

  // if we have a projectRoot
  pr = obj.projectRoot

  if (pr) {
    // reset fileServerFolder to be absolute
    // obj.fileServerFolder = path.resolve(pr, obj.fileServerFolder)

    // and do the same for all the rest
    _.extend(obj, convertRelativeToAbsolutePaths(pr, obj, defaults))
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

  const matchesConfigKey = function (key) {
    if (_.has(defaultValues, key)) {
      return key
    }

    key = key.toLowerCase().replace(dashesOrUnderscoresRe, '')
    key = _.camelCase(key)

    if (_.has(defaultValues, key)) {
      return key
    }
  }

  const configFromEnv = _.reduce(envProc, (memo: string[], val, key) => {
    let cfgKey: string

    cfgKey = matchesConfigKey(key)

    if (cfgKey) {
      // only change the value if it hasnt been
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

  // envCfg is from cypress.json
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

export function getNameFromRoot (root = '') {
  return path.basename(root)
}
