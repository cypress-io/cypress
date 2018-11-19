/* eslint-disable
    default-case,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const UrlParse = require('url-parse')
const konfig = require('../konfig')

const api_url = konfig('api_url')

let routes = {
  api: '',
  auth: 'auth',
  ping: 'ping',
  signin: 'signin',
  signout: 'signout',
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
    switch (false) {
      case !_.isObject(value):
        return url.set('query', _.extend(url.query, value))

      case !_.isString(value) && !_.isNumber(value):
        return url.set('pathname', url.pathname.replace(':id', value))
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
}
  , {})

module.exports = routes
