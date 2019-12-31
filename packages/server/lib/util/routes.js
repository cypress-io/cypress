const _ = require('lodash')
const UrlParse = require('url-parse')
const konfig = require('../konfig')

const api_url = konfig('api_url')

let routes = {
  api: '',
  auth: 'auth',
  me: 'me',
  ping: 'ping',
  runs: 'runs',
  instances: 'runs/:id/instances',
  instance: 'instances/:id',
  instanceStdout: 'instances/:id/stdout',
  orgs: 'organizations',
  projects: 'projects',
  project: 'projects/:id',
  projectToken: 'projects/:id/token',
  projectRuns: 'projects/:id/runs',
  projectRecordKeys: 'projects/:id/keys',
  exceptions: 'exceptions',
  membershipRequests: 'projects/:id/membership_requests',
}

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

routes = _.reduce(routes, (memo, value, key) => {
  memo[key] = function (...args) {
    let url = new UrlParse(api_url, true)

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

module.exports = routes
