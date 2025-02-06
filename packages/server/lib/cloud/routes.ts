import _ from 'lodash'
import UrlParse from 'url-parse'

const app_config = require('../../config/app.json')
const apiUrl = app_config[process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'].api_url

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
  studio: 'studio/bundle/current.tgz',
  studioErrors: 'studio/errors',
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

const makeRoutes = (baseUrl: string, routes: typeof CLOUD_ENDPOINTS) => {
  return _.reduce(routes, (memo, value, key) => {
    memo[key] = function (...args: any[]) {
      let url = new UrlParse(baseUrl, true)

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

const apiRoutes = makeRoutes(apiUrl, CLOUD_ENDPOINTS)

module.exports = {
  apiUrl,
  apiRoutes,
  makeRoutes: (baseUrl) => makeRoutes(baseUrl, CLOUD_ENDPOINTS),
}
