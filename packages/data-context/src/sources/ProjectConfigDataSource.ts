import { Draft, Immutable, produce } from 'immer'
import assert from 'assert'
import configUtils, { allowed } from '@packages/config'
import debugLib from 'debug'
import _ from 'lodash'
import url from 'url'
import path from 'path'

import type { DataContext } from '..'
import type { CoreDataShape, CurrentProjectDataShape } from '../data'
import type { ResolvedConfigurationOptions, ResolvedFromConfig } from '@packages/types'

const debug = debugLib('projectConfigDataSource')

const folders = _(configUtils.options).filter({ isFolder: true }).map('name').value()

export const CYPRESS_ENV_PREFIX = 'CYPRESS_'

export const CYPRESS_ENV_PREFIX_LENGTH = 'CYPRESS_'.length

export const CYPRESS_RESERVED_ENV_VARS = [
  'CYPRESS_INTERNAL_ENV',
]

export const CYPRESS_SPECIAL_ENV_VARS = [
  'RECORD_KEY',
]

export const isDefault = (config: Record<string, any>, prop: string) => {
  return config.resolved[prop].from === 'default'
}

export type FullConfig =
  Cypress.RuntimeConfigOptions &
  Cypress.ResolvedConfigOptions &
  {
    resolved: ResolvedConfigurationOptions
  }

export class ProjectConfigDataSource {
  private currentProjectData: CurrentProjectDataShape

  constructor (private ctx: DataContext) {
    assert(this.ctx.currentProject, `Expected currentProject to be set when calling ctx.projectConfig`)
    this.currentProjectData = this.ctx.currentProject
  }

  /**
   * Whenever we have an Immer update, we compare the keys which form the "full config",
   * and if any of them have changed, we re-compute & store the updated object
   */
  shouldRebuildConfig (prevState: Immutable<CoreDataShape>, nextState: Immutable<CoreDataShape>): boolean {
    if (prevState === nextState) {
      return false
    }

    if (prevState.machineBrowsers !== nextState.machineBrowsers) {
      //
    }
  }

  loadedConfig () {
    //
  }

  /**
   * After we have sourced the config from cypress.config.{js|ts},
   * we combine these options with the options passed in the CLI, the "found browsers", the cypress.env.json
   * and make a Cypress.
   */
  makeSetupNodeEventsConfig (): Immutable<Cypress.Config> {
    // 1. Get the "config", by merging the defaults, the result of the config file sourcing, and the CLI vars
    return produce({} as Immutable<Cypress.Config>, (obj) => {
      if (this.currentProjectData.config.state === 'LOADED') {
        Object.assign(obj, this.currentProjectData.config.value)
      }

      if (this.currentProjectData.pluginLoad.state === 'LOADED') {
        const value = this.currentProjectData.pluginLoad.value
        //
      }
    })
  }

  getConfig () {

  }

  private get (
    options: { configFile?: string | false } = { configFile: undefined },
    ctx: DataContext,
  ): Promise<FullConfig> {
    return Promise.all([
      settings.read(projectRoot, options, ctx).then(validateFile(options.configFile ?? 'cypress.config.{ts|js}')),
      settings.readEnv(projectRoot).then(validateFile('cypress.env.json')),
    ])
    .spread((settings, envFile) => {
      return this.set({
        projectName: path.basename(this.currentProjectData.projectRoot),
        projectRoot,
        config: _.cloneDeep(settings),
        envFile: _.cloneDeep(envFile),
        options,
      })
    })
  }

  /**
   *
   */
  private set (obj: Record<string, any> = {}) {
    let { projectRoot, projectName, config, envFile, options } = obj

    // just force config to be an object so we dont have to do as much
    // work in our tests
    if (config == null) {
      config = {}
    }

    // flatten the object's properties into the master config object
    config.envFile = envFile
    config.projectRoot = projectRoot
    config.projectName = projectName

    return this.mergeDefaults(config, options)
  }

  // make sure every option returned from the plugins file
  // passes our validation functions
  private updateWithPluginValues (cfg, overrides = {}) {
    configUtils.validate(overrides, (errMsg) => {
      if (cfg.configFile && cfg.projectRoot) {
        const relativeConfigPath = path.relative(cfg.projectRoot, cfg.configFile)

        throw this.ctx.error('PLUGINS_CONFIG_VALIDATION_ERROR', relativeConfigPath, errMsg)
      }

      throw this.ctx.error('CONFIG_VALIDATION_ERROR', errMsg)
    })

    let originalResolvedBrowsers = cfg && cfg.resolved && cfg.resolved.browsers && _.cloneDeep(cfg.resolved.browsers)

    if (!originalResolvedBrowsers) {
      // have something to resolve with if plugins return nothing
      originalResolvedBrowsers = {
        value: cfg.browsers,
        from: 'default',
      } as ResolvedFromConfig
    }

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
      this.setPluginResolvedOn(cfg.resolved, diffs)
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

  private setPluginResolvedOn (resolvedObj: Record<string, any>, obj: Record<string, any>): void {
    for (const [key, val] of Object.entries(obj)) {
      if (_.isObject(val) && !_.isArray(val) && resolvedObj[key]) {
        this.setPluginResolvedOn()
      }
    }

    return _.each(obj, (val, key) => {
      if (_.isObject(val) && !_.isArray(val) && resolvedObj[key]) {
        // recurse setting overrides
        // inside of objected
        return this.setPluginResolvedOn(resolvedObj[key], val)
      }

      const valueFrom: ResolvedFromConfig = {
        value: val,
        from: 'plugin',
      }

      resolvedObj[key] = valueFrom
    })
  }

  private setUrls (obj) {
    obj = _.clone(obj)

    // TODO: rename this to be proxyServer
    const proxyUrl = `http://localhost:${obj.port}`

    const rootUrl = obj.baseUrl ?
      this.origin(obj.baseUrl)
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

  private setAbsolutePaths (obj: Draft<Cypress.Config>) {
    for (const folder of folders) {
      const val = obj[folder]

      if (typeof val === 'string') {
        // @ts-expect-error
        obj[folder] = path.isAbsolute(val) ? val : path.resolve(this.currentProjectData.projectRoot, val)
      }
    }
  }

  private mergeDefaults (config: Record<string, any> = {}, options: Record<string, any> = {}) {
    const resolved = {}

    config.rawJson = _.cloneDeep(config)

    _.extend(config, _.pick(options, 'configFile', 'morgan', 'isTextTerminal', 'socketId', 'report', 'browsers'))
    debug('merged config with options, got %o', config)

    allowed(options)

    _
    .chain(configUtils.allowed(options))
    .omit('env')
    .omit('browsers')
    .each((val, key) => {
      resolved[key] = 'cli'
      config[key] = val
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

    // split out our own app wide env from user env variables
    // and delete envFile
    config.env = this.parseEnv(config, options.env, resolved)

    config.cypressEnv = process.env.CYPRESS_INTERNAL_ENV
    debug('using CYPRESS_INTERNAL_ENV %s', config.cypressEnv)
    if (!this.isValidCypressInternalEnvValue(config.cypressEnv)) {
      throw this.ctx.error('INVALID_CYPRESS_INTERNAL_ENV', config.cypressEnv)
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

    config.resolved = this.resolveConfigValues(config, defaults, resolved)

    if (config.port) {
      config = this.setUrls(config)
    }

    this.setAbsolutePaths(config)
    this.setNodeBinary(config, options.args?.userNodePath, options.args?.userNodeVersion)

    // validate config again here so that we catch configuration errors coming
    // from the CLI overrides or env var overrides
    configUtils.validate(_.omit(config, 'browsers'), (errMsg) => {
      return errors.throw('CONFIG_VALIDATION_ERROR', errMsg)
    })

    configUtils.validateNoBreakingConfig(config, errors.warning, errors.throw)

    return this.setSupportFileAndFolder(config, defaultsForRuntime)
  }

  // combines the default configuration object with values specified in the
  // configuration file like "cypress.{ts|js}". Values in configuration file
  // overwrite the defaults.
  private resolveConfigValues (config, defaults, resolved = {}) {
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

  private setNodeBinary = (obj, userNodePath, userNodeVersion) => {
    // if execPath isn't found we weren't executed from the CLI and should used the bundled node version.
    if (userNodePath && userNodeVersion && obj.nodeVersion !== 'bundled') {
      obj.resolvedNodePath = userNodePath
      obj.resolvedNodeVersion = userNodeVersion

      return obj
    }

    obj.resolvedNodeVersion = process.versions.node

    return obj
  }

  private isValidCypressInternalEnvValue (value) {
    // names of config environments, see "config/app.yml"
    const names = ['development', 'test', 'staging', 'production']

    return _.includes(names, value)
  }

  private setSupportFileAndFolder (obj, defaults) {
    try {
      require.resolve(this.ctx.coreData.currentProject.config)
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {

      }
    }

    if (!obj.supportFile) {
      return Bluebird.resolve(obj)
    }

    obj = _.clone(obj)

    // TODO move this logic to find support file into util/path_helpers
    const sf = obj.supportFile

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
      obj.supportFile = path.join(sf, path.basename(obj.supportFile))

      return fs.pathExists(obj.supportFile)
      .then((found) => {
        if (!found) {
          throw this.ctx.error('SUPPORT_FILE_NOT_FOUND', obj.supportFile, obj.configFile || defaults.configFile)
        }

        return debug('switching to found file %s', obj.supportFile)
      })
    }).catch({ code: 'MODULE_NOT_FOUND' }, () => {
      debug('support JS module %s does not load', sf)

      const loadingDefaultSupportFile = sf === path.resolve(obj.projectRoot, defaults.supportFile)

      return utils.discoverModuleFile({
        filename: sf,
        isDefault: loadingDefaultSupportFile,
        projectRoot: obj.projectRoot,
      })
      .then((result) => {
        if (result === null) {
          const configFile = obj.configFile || defaults.configFile

          throw this.ctx.error('SUPPORT_FILE_NOT_FOUND', path.resolve(obj.projectRoot, sf), configFile)
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

  private getProcessEnvVars = (obj: NodeJS.ProcessEnv) => {
    return _.reduce(obj, (memo, value, key) => {
      if (!value) {
        return memo
      }

      if (isCypressEnvLike(key)) {
        memo[removeEnvPrefix(key)] = coerce(value)
      }

      return memo
    }
    , {})
  }

  private isCypressEnvLike = (key) => {
    return _.chain(key)
    .invoke('toUpperCase')
    .startsWith(CYPRESS_ENV_PREFIX)
    .value() &&
    !_.includes(CYPRESS_RESERVED_ENV_VARS, key)
  }

  private removeEnvPrefix = (key: string) => {
    return key.slice(CYPRESS_ENV_PREFIX_LENGTH)
  }

  private parseEnv (cfg: Record<string, any>, envCLI: Record<string, any>, resolved: Record<string, any> = {}) {
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
      let cfgKey: string

      cfgKey = configUtils.matchesConfigKey(key)

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
    .mapValues(this.hideSpecialVals)
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

  private convertRelativeToAbsolutePaths = (projectRoot, obj) => {

  }

  private injectCtSpecificConfig (cfg) {
    // cfg.resolved.testingType = { value: 'component' }

    // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
    // But if we don't return it in the plugins function, it never gets set
    // Since there is no chance that it will have any other value here, we set it to "component"
    // This allows users to not return config in the `cypress/plugins/index.js` file
    // https://github.com/cypress-io/cypress/issues/16860
    const rawJson = cfg.rawJson as Cfg

    return {
      ...cfg,
      viewportHeight: rawJson.viewportHeight ?? 500,
      viewportWidth: rawJson.viewportWidth ?? 500,
    }
  }

  private hideSpecialVals = function (val, key) {
    if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
      return keys.hide(val)
    }

    return val
  }

  // tries to find support or plugins file
  // returns:
  //   false - if the file should not be set
  //   string - found filename
  //   null - if there is an error finding the file
  private discoverModuleFile (options) {
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
  }

  private flattenCypress = (obj) => {
    return obj.cypress ? obj.cypress : undefined
  }

  private renameVisitToPageLoad = (obj) => {
    const v = obj.visitTimeout

    if (v) {
      obj = _.omit(obj, 'visitTimeout')
      obj.pageLoadTimeout = v

      return obj
    }
  }

  private renameCommandTimeout = (obj) => {
    const c = obj.commandTimeout

    if (c) {
      obj = _.omit(obj, 'commandTimeout')
      obj.defaultCommandTimeout = c

      return obj
    }
  }

  private _pathToFile (projectRoot, file) {
    return path.isAbsolute(file) ? file : path.join(projectRoot, file)
  }

  private _err (type, file, err) {
    const e = errors.get(type, file, err)

    e.code = err.code
    e.errno = err.errno
    throw e
  }

  private renameSupportFolder = (obj) => {
    const sf = obj.supportFolder

    if (sf) {
      obj = _.omit(obj, 'supportFolder')
      obj.supportFile = sf

      return obj
    }
  }

  private _applyRewriteRules (obj = {}) {
    return _.reduce([flattenCypress, renameVisitToPageLoad, renameCommandTimeout, renameSupportFolder], (memo, fn) => {
      const ret = fn(memo)

      return ret ? ret : memo
    }, _.cloneDeep(obj))
  }

  private async settingsRead (options: SettingsOptions = {}) {
    assert(ctx.currentProject?.currentTestingType, 'expected ctx.currentProject.currentTestingType in settings.read')
    assert(ctx.currentProject?.projectRoot, 'expected ctx.currentProject.projectRoot in settings.read')

    const projectRoot = ctx.currentProject.projectRoot
    const file = pathToConfigFile(projectRoot, options)

    return ctx.loadingManager.projectConfig.load()
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
      const changed = this._applyRewriteRules(configObject)

      // if our object is unchanged
      // then just return it
      if (_.isEqual(configObject, changed)) {
        return configObject
      }

      return config
    }).catch((err) => {
      debug('an error occurred when reading config', err)
      if (errors.isCypressErr(err)) {
        throw err
      }

      throw this.ctx.error('ERROR_READING_FILE', file, err)
    })
  }

  private origin (urlStr: string) {
    const parsed = url.parse(urlStr)

    parsed.hash = null
    parsed.search = null
    parsed.query = null
    parsed.path = null
    parsed.pathname = null

    return url.format(parsed)
  }
}
