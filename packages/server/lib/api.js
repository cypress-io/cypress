const _ = require('lodash')
const os = require('os')
const debug = require('debug')('cypress:server:api')
const request = require('@cypress/request-promise')
const errors = require('@cypress/request-promise/errors')
const Promise = require('bluebird')
const humanInterval = require('human-interval')
const { agent } = require('@packages/network')
const pkg = require('@packages/root')
const machineId = require('./util/machine_id')
const { apiRoutes, onRoutes } = require('./util/routes')

const THIRTY_SECONDS = humanInterval('30 seconds')
const SIXTY_SECONDS = humanInterval('60 seconds')
const TWO_MINUTES = humanInterval('2 minutes')

let intervals

let DELAYS = [
  THIRTY_SECONDS,
  SIXTY_SECONDS,
  TWO_MINUTES,
]

let responseCache = {}

intervals = process.env.API_RETRY_INTERVALS

if (intervals) {
  DELAYS = _
  .chain(intervals)
  .split(',')
  .map(_.toNumber)
  .value()
}

const rp = request.defaults((params = {}, callback) => {
  let resp

  if (params.cacheable && (resp = getCachedResponse(params))) {
    debug('resolving with cached response for ', params.url)

    return Promise.resolve(resp)
  }

  _.defaults(params, {
    agent,
    proxy: null,
    gzip: true,
    cacheable: false,
  })

  const headers = params.headers != null ? params.headers : (params.headers = {})

  _.defaults(headers, {
    'x-os-name': os.platform(),
    'x-cypress-version': pkg.version,
  })

  const method = params.method.toLowerCase()

  // use %j argument to ensure deep nested properties are serialized
  debug(
    'request to url: %s with params: %j and token: %s',
    `${params.method} ${params.url}`,
    _.pick(params, 'body', 'headers'),
    params.auth && params.auth.bearer,
  )

  return request[method](params, callback)
  .promise()
  .tap((resp) => {
    if (params.cacheable) {
      debug('caching response for ', params.url)
      cacheResponse(resp, params)
    }

    return debug('response %o', resp)
  })
})

const cacheResponse = (resp, params) => {
  return responseCache[params.url] = resp
}

const getCachedResponse = (params) => {
  return responseCache[params.url]
}

const formatResponseBody = function (err) {
  // if the body is JSON object
  if (_.isObject(err.error)) {
    // transform the error message to include the
    // stringified body (represented as the 'error' property)
    const body = JSON.stringify(err.error, null, 2)

    err.message = [err.statusCode, body].join('\n\n')
  }

  throw err
}

const tagError = function (err) {
  err.isApiError = true
  throw err
}

// retry on timeouts, 5xx errors, or any error without a status code
const isRetriableError = (err) => {
  return (err instanceof Promise.TimeoutError) ||
    (500 <= err.statusCode && err.statusCode < 600) ||
    (err.statusCode == null)
}

module.exports = {
  rp,

  ping () {
    return rp.get(apiRoutes.ping())
    .catch(tagError)
  },

  getMe (authToken) {
    return rp.get({
      url: apiRoutes.me(),
      json: true,
      auth: {
        bearer: authToken,
      },
    })
  },

  getAuthUrls () {
    return rp.get({
      url: apiRoutes.auth(),
      json: true,
      cacheable: true,
      headers: {
        'x-route-version': '2',
      },
    })
    .catch(tagError)
  },

  getOrgs (authToken) {
    return rp.get({
      url: apiRoutes.orgs(),
      json: true,
      auth: {
        bearer: authToken,
      },
    })
    .catch(tagError)
  },

  getProjects (authToken) {
    return rp.get({
      url: apiRoutes.projects(),
      json: true,
      auth: {
        bearer: authToken,
      },
    })
    .catch(tagError)
  },

  getProject (projectId, authToken) {
    return rp.get({
      url: apiRoutes.project(projectId),
      json: true,
      auth: {
        bearer: authToken,
      },
      headers: {
        'x-route-version': '2',
      },
    })
    .catch(tagError)
  },

  getProjectRuns (projectId, authToken, options = {}) {
    if (options.page == null) {
      options.page = 1
    }

    return rp.get({
      url: apiRoutes.projectRuns(projectId),
      json: true,
      timeout: options.timeout != null ? options.timeout : 10000,
      auth: {
        bearer: authToken,
      },
      headers: {
        'x-route-version': '3',
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  createRun (options = {}) {
    const body = _.pick(options, [
      'ci',
      'specs',
      'commit',
      'group',
      'platform',
      'parallel',
      'ciBuildId',
      'projectId',
      'recordKey',
      'specPattern',
      'tags',
    ])

    return rp.post({
      body,
      url: apiRoutes.runs(),
      json: true,
      timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
      headers: {
        'x-route-version': '4',
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  createInstance (options = {}) {
    const { runId, timeout } = options

    const body = _.pick(options, [
      'spec',
      'groupId',
      'machineId',
      'platform',
    ])

    return rp.post({
      body,
      url: apiRoutes.instances(runId),
      json: true,
      timeout: timeout != null ? timeout : SIXTY_SECONDS,
      headers: {
        'x-route-version': '5',
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  updateInstanceStdout (options = {}) {
    return rp.put({
      url: apiRoutes.instanceStdout(options.instanceId),
      json: true,
      timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
      body: {
        stdout: options.stdout,
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  updateInstance (options = {}) {
    return rp.put({
      url: apiRoutes.instance(options.instanceId),
      json: true,
      timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
      headers: {
        'x-route-version': '3',
      },
      body: _.pick(options, [
        'stats',
        'tests',
        'error',
        'video',
        'hooks',
        'stdout',
        'screenshots',
        'cypressConfig',
        'reporterStats',
      ]),
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  createCrashReport (body, authToken, timeout = 3000) {
    return rp.post({
      url: apiRoutes.exceptions(),
      json: true,
      body,
      auth: {
        bearer: authToken,
      },
    })
    .timeout(timeout)
    .catch(tagError)
  },

  postLogout (authToken) {
    return Promise.join(
      this.getAuthUrls(),
      machineId.machineId(),
      (urls, machineId) => {
        return rp.post({
          url: urls.dashboardLogoutUrl,
          json: true,
          auth: {
            bearer: authToken,
          },
          headers: {
            'x-machine-id': machineId,
          },
        })
        .catch({ statusCode: 401 }, () => {}) // do nothing on 401
        .catch(tagError)
      },
    )
  },

  createProject (projectDetails, remoteOrigin, authToken) {
    debug('create project with args %o', {
      projectDetails,
      remoteOrigin,
      authToken,
    })

    return rp.post({
      url: apiRoutes.projects(),
      json: true,
      auth: {
        bearer: authToken,
      },
      headers: {
        'x-route-version': '2',
      },
      body: {
        name: projectDetails.projectName,
        orgId: projectDetails.orgId,
        public: projectDetails.public,
        remoteOrigin,
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  getProjectRecordKeys (projectId, authToken) {
    return rp.get({
      url: apiRoutes.projectRecordKeys(projectId),
      json: true,
      auth: {
        bearer: authToken,
      },
    })
    .catch(tagError)
  },

  requestAccess (projectId, authToken) {
    return rp.post({
      url: apiRoutes.membershipRequests(projectId),
      json: true,
      auth: {
        bearer: authToken,
      },
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  _projectToken (method, projectId, authToken) {
    return rp({
      method,
      url: apiRoutes.projectToken(projectId),
      json: true,
      auth: {
        bearer: authToken,
      },
      headers: {
        'x-route-version': '2',
      },
    })
    .get('apiToken')
    .catch(tagError)
  },

  getProjectToken (projectId, authToken) {
    return this._projectToken('get', projectId, authToken)
  },

  updateProjectToken (projectId, authToken) {
    return this._projectToken('put', projectId, authToken)
  },

  getReleaseNotes (version) {
    return rp.get({
      url: onRoutes.releaseNotes(version),
      json: true,
    })
    .catch((err) => {
      // log and ignore by sending an empty response if there's an error
      debug('error getting release notes for version %s: %s', version, err.stack || err.message || err)

      return {}
    })
  },

  retryWithBackoff (fn, options = {}) {
    // for e2e testing purposes
    let attempt

    if (process.env.DISABLE_API_RETRIES) {
      debug('api retries disabled')

      return Promise.try(fn)
    }

    return (attempt = (retryIndex) => {
      return Promise
      .try(fn)
      .catch(isRetriableError, (err) => {
        if (retryIndex > DELAYS.length) {
          throw err
        }

        const delay = DELAYS[retryIndex]

        if (options.onBeforeRetry) {
          options.onBeforeRetry({
            err,
            delay,
            retryIndex,
            total: DELAYS.length,
          })
        }

        retryIndex++

        return Promise
        .delay(delay)
        .then(() => {
          debug(`retry #${retryIndex} after ${delay}ms`)

          return attempt(retryIndex)
        })
      })
    })(0)
  },

  clearCache () {
    responseCache = {}
  },
}
