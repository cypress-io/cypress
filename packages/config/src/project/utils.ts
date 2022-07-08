import _ from 'lodash'
import path from 'path'

import { getProcessEnvVars, CYPRESS_SPECIAL_ENV_VARS } from '@packages/server/lib/util/config'
import type { ResolvedFromConfig } from '@packages/types'

import { matchesConfigKey } from '../browser'
import { hideKeys } from '../utils'

const hideSpecialVals = function (val, key) {
  if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
    return hideKeys(val)
  }

  return val
}

// an object with a few utility methods for easy stubbing from unit tests
export const utils = {
  getProcessEnvVars,
}

export function parseEnv (cfg: Record<string, any>, envCLI: Record<string, any>, resolved: Record<string, any> = {}) {
  const envVars: any = (resolved.env = {})

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
  let envProc = utils.getProcessEnvVars(process.env) || {}

  envCLI = envCLI != null ? envCLI : {}

  const configFromEnv = _.reduce(envProc, (memo: string[], val, key) => {
    const cfgKey = matchesConfigKey(key)

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
  }, [])

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
export const checkIfResolveChangedRootFolder = (resolved, initial) => {
  return path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)
}
