import _ from 'lodash'
import UrlParse from 'url-parse'

const app_config = require('../../config/app.json')

/**
 * Read on each call rather than at module scope. This module is only kept out of the V8
 * snapshot by its place in the generated deferred list, which is rebuilt from scratch
 * whenever yarn.lock changes; a module-level value would freeze into the binary as
 * `development` the moment that classification shifts.
 */
export const getApiUrl = (): string => {
  return app_config[process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'].api_url
}

const CLOUD_ENDPOINTS = {
  api: '',
  auth: 'auth',
  ping: 'ping',
  runs: 'runs',
  instances: 'runs/:id/instances',
  instanceTests: 'instances/:id/tests',
  instanceResults: 'instances/:id/results',
  instanceStdout: 'instances/:id/stdout',
  instanceArtifacts: 'instances/:id/artifacts',
  captureProtocolErrors: 'capture-protocol/errors',
  studioSession: 'studio/session',
  studioErrors: 'studio/errors',
  cyPromptSession: 'cy-prompt/session',
  cyPromptErrors: 'cy-prompt/errors',
  exceptions: 'exceptions',
  telemetry: 'telemetry',
} as const

const parseArgs = function (url, args: any[] = []) {
  _.each(args, (value) => {
    if (_.isObject(value)) {
      url.set('query', _.extend(url.query, value))

      return
    }

    if (_.isString(value) || _.isNumber(value)) {
      url.set('pathname', url.pathname.replace(':id', value))

      return
    }
  })

  return url
}

const _makeRoutes = (baseUrl: string | (() => string), routes: typeof CLOUD_ENDPOINTS) => {
  return _.reduce(routes, (memo, value, key) => {
    memo[key] = function (...args: any[]) {
      let url = new UrlParse(typeof baseUrl === 'function' ? baseUrl() : baseUrl, true)

      if (value) {
        url.set('pathname', value)
      }

      if (args.length) {
        url = parseArgs(url, args)
      }

      return url.toString()
    }

    return memo
  }, {} as Record<keyof typeof CLOUD_ENDPOINTS, (...args: any[]) => string>)
}

export const apiRoutes = _makeRoutes(getApiUrl, CLOUD_ENDPOINTS)

export const makeRoutes = (baseUrl) => _makeRoutes(baseUrl, CLOUD_ENDPOINTS)
