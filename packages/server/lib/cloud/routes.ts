import reduce from 'lodash.reduce'
import isObject from 'lodash.isobject'
import isString from 'lodash.isstring'
import isNumber from 'lodash.isnumber'
import UrlParse from 'url-parse'

const app_config = require('../../config/app.json')
const apiUrl = app_config[process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'].api_url

const CLOUD_ENDPOINTS = {
  api: '',
  auth: 'auth',
  me: 'me',
  ping: 'ping',
  runs: 'runs',
  instances: 'runs/:id/instances',
  instanceTests: 'instances/:id/tests',
  instanceResults: 'instances/:id/results',
  instanceStdout: 'instances/:id/stdout',
  projects: 'projects',
  project: 'projects/:id',
  exceptions: 'exceptions',
} as const

const parseArgs = function (url, args: any[] = []) {
  args.forEach((value) => {
    if (isObject(value)) {
      url.set('query', {
        ...url.query,
        ...value,
      })

      return
    }

    if (isString(value) || isNumber(value)) {
      url.set('pathname', url.pathname.replace(':id', value))

      return
    }
  })

  return url
}

const makeRoutes = (routes: typeof CLOUD_ENDPOINTS) => {
  return reduce(routes, (memo, value, key) => {
    memo[key] = function (...args: any[]) {
      let url = new UrlParse(apiUrl, true)

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

const apiRoutes = makeRoutes(CLOUD_ENDPOINTS)

module.exports = {
  apiRoutes,
}
