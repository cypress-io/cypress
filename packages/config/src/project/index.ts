import _ from 'lodash'
import Debug from 'debug'
// @ts-ignore
import deepDiff from 'return-deep-diff'

import errors, { ConfigValidationFailureInfo, CypressError } from '@packages/errors'
import type {
  ResolvedFromConfig, TestingType, FullConfig,
} from '@packages/types'

import {
  validate,
  validateNoBreakingConfig,
} from '../browser'
import {
  setPluginResolvedOn,
  mergeDefaults,
} from './utils'

const debug = Debug('cypress:config:project')

// TODO: any -> SetupFullConfigOptions in data-context/src/data/ProjectConfigManager.ts
export function setupFullConfigWithDefaults (obj: any = {}, getFilesByGlob: any): Promise<FullConfig> {
  debug('setting config object %o', obj)
  let { projectRoot, projectName, config, envFile, options, cliConfig, repoRoot } = obj

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
  config.repoRoot = repoRoot

  // @ts-ignore
  return mergeDefaults(config, options, cliConfig, getFilesByGlob)
}

// TODO: update types from data-context/src/data/ProjectLifecycleManager.ts
// updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>, testingType: TestingType): FullConfig
export function updateWithPluginValues (cfg: FullConfig, modifiedConfig: any, testingType: TestingType): FullConfig {
  if (!modifiedConfig) {
    modifiedConfig = {}
  }

  debug('updateWithPluginValues %o', { cfg, modifiedConfig })

  // make sure every option returned from the plugins file
  // passes our validation functions
  validate(modifiedConfig, (validationResult: ConfigValidationFailureInfo | string) => {
    let configFile = cfg.configFile!

    if (_.isString(validationResult)) {
      return errors.throwErr('CONFIG_VALIDATION_MSG_ERROR', 'configFile', configFile, validationResult)
    }

    return errors.throwErr('CONFIG_VALIDATION_ERROR', 'configFile', configFile, validationResult)
  }, testingType)

  debug('validate that there is no breaking config options added by setupNodeEvents')

  function makeSetupError (cyError: CypressError) {
    cyError.name = `Error running ${testingType}.setupNodeEvents()`

    return cyError
  }

  validateNoBreakingConfig(modifiedConfig, errors.warning, (err, options) => {
    throw makeSetupError(errors.get(err, options))
  }, testingType)

  validateNoBreakingConfig(modifiedConfig[testingType], errors.warning, (err, options) => {
    throw makeSetupError(errors.get(err, {
      ...options,
      name: `${testingType}.${options.name}`,
    }))
  }, testingType)

  const originalResolvedBrowsers = _.cloneDeep(cfg?.resolved?.browsers) ?? {
    value: cfg.browsers,
    from: 'default',
  } as ResolvedFromConfig

  const diffs = deepDiff(cfg, modifiedConfig, true)

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

  const diffsClone = _.cloneDeep(diffs) ?? {}

  // merge cfg into overrides
  const merged = _.defaultsDeep(diffs, cfg) ?? {}

  for (const [key, value] of Object.entries(diffsClone)) {
    if (Array.isArray(value)) {
      merged[key] = _.cloneDeep(value)
    }
  }

  debug('merged config object %o', merged)

  // the above _.defaultsDeep combines arrays,
  // if diffs.browsers = [1] and cfg.browsers = [1, 2]
  // then the merged result merged.browsers = [1, 2]
  // which is NOT what we want
  if (Array.isArray(userBrowserList) && userBrowserList.length) {
    merged.browsers = userBrowserList
    merged.resolved.browsers.value = userBrowserList
  }

  if (modifiedConfig.browsers === null) {
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
