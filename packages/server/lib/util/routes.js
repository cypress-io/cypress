const _ = require('lodash')
const UrlParse = require('url-parse')
const konfig = require('../konfig')

const apiUrl = konfig('api_url')

const parseArgs = function (url, args = []) {
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

const makeRoutes = (baseUrl, routes) => {
  return _.reduce(routes, (memo, value, key) => {
    memo[key] = function (...args) {
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
  }, {})
}

const apiRoutes = makeRoutes(apiUrl, {
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
})

module.exports = {
  apiRoutes,
}
