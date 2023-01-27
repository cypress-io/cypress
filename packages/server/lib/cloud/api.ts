const _ = require('lodash')
const os = require('os')
const debug = require('debug')('cypress:server:cloud:api')
const request = require('@cypress/request-promise')
const Promise = require('bluebird')
const humanInterval = require('human-interval')

const RequestErrors = require('@cypress/request-promise/errors')
const { agent } = require('@packages/network')
const pkg = require('@packages/root')

const machineId = require('./machine_id')
const errors = require('../errors')
const { apiUrl, apiRoutes, makeRoutes } = require('./routes')

import Bluebird from 'bluebird'
import type { OptionsWithUrl } from 'request-promise'
import * as enc from './encryption'

const THIRTY_SECONDS = humanInterval('30 seconds')
const SIXTY_SECONDS = humanInterval('60 seconds')
const TWO_MINUTES = humanInterval('2 minutes')

const DELAYS = process.env.API_RETRY_INTERVALS ? process.env.API_RETRY_INTERVALS.split(',').map(_.toNumber) : [
  THIRTY_SECONDS,
  SIXTY_SECONDS,
  TWO_MINUTES,
]

const runnerCapabilities = {
  'dynamicSpecsInSerialMode': true,
  'skipSpecAction': true,
}

let responseCache = {}

export interface CypressRequestOptions extends OptionsWithUrl {
  encrypt?: boolean
  method: string
  cacheable?: boolean
}

const rp = request.defaults((params: CypressRequestOptions, callback) => {
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
    encrypt: false,
    rejectUnauthorized: true,
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

  return Bluebird.try(async () => {
    // If we're encrypting the request, we generate the JWE
    // and set it to the JSON body for the request
    if (params.encrypt) {
      const { secretKey, jwe } = await enc.encryptRequest(params)

      params.transform = (body, response) => {
        if (response.headers['x-cypress-encrypted']) {
          return enc.decryptResponse(body, secretKey)
        }

        return body
      }

      params.body = jwe

      headers['x-cypress-encrypted'] = '1'
    }

    return request[method](params, callback).promise()
  })
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

const retryWithBackoff = (fn) => {
  // for e2e testing purposes
  let attempt

  if (process.env.DISABLE_API_RETRIES) {
    debug('api retries disabled')

    return Promise.try(() => fn(0))
  }

  return (attempt = (retryIndex) => {
    return Promise
    .try(() => fn(retryIndex))
    .catch(isRetriableError, (err) => {
      if (retryIndex > DELAYS.length) {
        throw err
      }

      const delay = DELAYS[retryIndex]

      errors.warning(
        'CLOUD_API_RESPONSE_FAILED_RETRYING', {
          delay,
          tries: DELAYS.length - retryIndex,
          response: err,
        },
      )

      retryIndex++

      return Promise
      .delay(delay)
      .then(() => {
        debug(`retry #${retryIndex} after ${delay}ms`)

        return attempt(retryIndex)
      })
    })
  })(0)
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
    (err.statusCode == null) && !err.message?.includes('routines:RSA_padding_check_PKCS1_OAEP_mgf1')
}

export type CreateRunOptions = {
  ci: string
  ciBuildId: string
  projectId: string
  recordKey: string
  commit: string
  specs: string[]
  group: string
  platform: string
  parallel: boolean
  specPattern: string[]
  tags: string[]
  testingType: 'e2e' | 'component'
  timeout?: number
}

let preflightResult = {
  encrypt: true,
  apiUrl,
}

let recordRoutes = apiRoutes

module.exports = {
  rp,

  // For internal testing
  setPreflightResult (toSet) {
    preflightResult = {
      ...preflightResult,
      ...toSet,
    }
  },

  resetPreflightResult () {
    preflightResult = {
      encrypt: true,
      apiUrl,
    }
  },

  ping () {
    return rp.get(apiRoutes.ping())
    .catch(tagError)
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

  preflight (preflightInfo) {
    return retryWithBackoff(async (attemptIndex) => {
      const result = await rp.post({
        url: `${apiUrl.replace('api', 'api-proxy')}preflight`,
        body: {
          apiUrl,
          envUrl: process.env.CYPRESS_API_URL,
          ...preflightInfo,
        },
        headers: {
          'x-route-version': '1',
          'x-cypress-request-attempt': attemptIndex,
        },
        json: true,
        encrypt: true,
      })

      preflightResult = result
      recordRoutes = makeRoutes(result.apiUrl)

      return result
    })
  },

  createRun (options: CreateRunOptions) {
    return retryWithBackoff((attemptIndex) => {
      const body = {
        ..._.pick(options, [
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
          'testingType',
        ]),
        runnerCapabilities,
      }

      return rp.post({
        body,
        url: recordRoutes.runs(),
        json: true,
        encrypt: preflightResult.encrypt,
        timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
        headers: {
          'x-route-version': '4',
          'x-cypress-request-attempt': attemptIndex,
        },
      })
      .catch(RequestErrors.StatusCodeError, formatResponseBody)
      .catch(tagError)
    })
  },

  createInstance (options) {
    const { runId, timeout } = options

    const body = _.pick(options, [
      'spec',
      'groupId',
      'machineId',
      'platform',
    ])

    return retryWithBackoff((attemptIndex) => {
      return rp.post({
        body,
        url: recordRoutes.instances(runId),
        json: true,
        encrypt: preflightResult.encrypt,
        timeout: timeout != null ? timeout : SIXTY_SECONDS,
        headers: {
          'x-route-version': '5',
          'x-cypress-run-id': runId,
          'x-cypress-request-attempt': attemptIndex,
        },
      })
      .catch(RequestErrors.StatusCodeError, formatResponseBody)
      .catch(tagError)
    })
  },

  postInstanceTests (options) {
    const { instanceId, runId, timeout, ...body } = options

    return retryWithBackoff((attemptIndex) => {
      return rp.post({
        url: recordRoutes.instanceTests(instanceId),
        json: true,
        encrypt: preflightResult.encrypt,
        timeout: timeout || SIXTY_SECONDS,
        headers: {
          'x-route-version': '1',
          'x-cypress-run-id': runId,
          'x-cypress-request-attempt': attemptIndex,
        },
        body,
      })
      .catch(RequestErrors.StatusCodeError, formatResponseBody)
      .catch(tagError)
    })
  },

  updateInstanceStdout (options) {
    return retryWithBackoff((attemptIndex) => {
      return rp.put({
        url: recordRoutes.instanceStdout(options.instanceId),
        json: true,
        timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
        body: {
          stdout: options.stdout,
        },
        headers: {
          'x-cypress-run-id': options.runId,
          'x-cypress-request-attempt': attemptIndex,

        },
      })
      .catch(RequestErrors.StatusCodeError, formatResponseBody)
      .catch(tagError)
    })
  },

  postInstanceResults (options) {
    return retryWithBackoff((attemptIndex) => {
      return rp.post({
        url: recordRoutes.instanceResults(options.instanceId),
        json: true,
        encrypt: preflightResult.encrypt,
        timeout: options.timeout != null ? options.timeout : SIXTY_SECONDS,
        headers: {
          'x-route-version': '1',
          'x-cypress-run-id': options.runId,
          'x-cypress-request-attempt': attemptIndex,
        },
        body: _.pick(options, [
          'stats',
          'tests',
          'exception',
          'video',
          'screenshots',
          'reporterStats',
          'metadata',
        ]),
      })
      .catch(RequestErrors.StatusCodeError, formatResponseBody)
      .catch(tagError)
    })
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

  clearCache () {
    responseCache = {}
  },

  retryWithBackoff,
}
