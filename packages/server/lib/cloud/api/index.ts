const _ = require('lodash')
const os = require('os')
const debug = require('debug')('cypress:server:cloud:api')
const debugProtocol = require('debug')('cypress:server:protocol')
const request = require('@cypress/request-promise')
const humanInterval = require('human-interval')

const RequestErrors = require('@cypress/request-promise/errors')
const { agent } = require('@packages/network')
const pkg = require('@packages/root')

const machineId = require('../machine_id')
const errors = require('../../errors')
const { apiUrl, apiRoutes, makeRoutes } = require('../routes')

import Bluebird from 'bluebird'
import { getText } from '../../util/status_code'
import * as enc from '../encryption'
import getEnvInformationForProjectRoot from '../environment'

import type { OptionsWithUrl } from 'request-promise'
import { fs } from '../../util/fs'
import ProtocolManager from '../protocol'
import type { ProjectBase } from '../../project-base'
import type { AfterSpecDurations } from '@packages/types'

const THIRTY_SECONDS = humanInterval('30 seconds')
const SIXTY_SECONDS = humanInterval('60 seconds')
const TWO_MINUTES = humanInterval('2 minutes')

const PUBLIC_KEY_VERSION = '1'

const DELAYS: number[] = process.env.API_RETRY_INTERVALS
  ? process.env.API_RETRY_INTERVALS.split(',').map(_.toNumber)
  : [THIRTY_SECONDS, SIXTY_SECONDS, TWO_MINUTES]

const runnerCapabilities = {
  'dynamicSpecsInSerialMode': true,
  'skipSpecAction': true,
  'protocolMountVersion': 2,
}

let responseCache = {}

const CAPTURE_ERRORS = !process.env.CYPRESS_LOCAL_PROTOCOL_PATH

class DecryptionError extends Error {
  isDecryptionError = true

  constructor (message: string) {
    super(message)
    this.name = 'DecryptionError'
  }
}

export interface CypressRequestOptions extends OptionsWithUrl {
  encrypt?: boolean | 'always' | 'signed'
  method: string
  cacheable?: boolean
}

// TODO: migrate to fetch from @cypress/request
const rp = request.defaults((params: CypressRequestOptions, callback) => {
  let resp

  if (params.cacheable && (resp = getCachedResponse(params))) {
    debug('resolving with cached response for %o', { url: params.url })

    return Bluebird.resolve(resp)
  }

  _.defaults(params, {
    agent,
    proxy: null,
    gzip: true,
    cacheable: false,
    encrypt: false,
    rejectUnauthorized: true,
  })

  const headers = params.headers ??= {}

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
    if (params.encrypt === true || params.encrypt === 'always') {
      const { secretKey, jwe } = await enc.encryptRequest(params)

      params.transform = async function (body, response) {
        const { statusCode } = response
        const options = this // request promise options

        const throwStatusCodeErrWithResp = (message, responseBody) => {
          throw new RequestErrors.StatusCodeError(response.statusCode, message, options, responseBody)
        }

        // response is valid and we are encrypting
        if (response.headers['x-cypress-encrypted'] || params.encrypt === 'always') {
          let decryptedBody

          try {
            decryptedBody = await enc.decryptResponse(body, secretKey)
          } catch (e) {
            // we failed decrypting the response...

            // if status code is >=500 or 404 remove body
            if (statusCode >= 500 || statusCode === 404) {
              // remove server responses and replace with basic status code text
              throwStatusCodeErrWithResp(getText(statusCode), body)
            }

            throw new DecryptionError(e.message)
          }

          // If we've hit an encrypted payload error case, we need to re-constitute the error
          // as it would happen normally, with the body as an error property
          if (response.statusCode > 400) {
            throwStatusCodeErrWithResp(decryptedBody, decryptedBody)
          }

          return decryptedBody
        }

        return body
      }

      params.body = jwe

      headers['x-cypress-encrypted'] = PUBLIC_KEY_VERSION
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
  if (process.env.DISABLE_API_RETRIES) {
    debug('api retries disabled')

    return Bluebird.try(() => fn(0))
  }

  const attempt = (retryIndex) => {
    return Bluebird
    .try(() => fn(retryIndex))
    .catch(RequestErrors.TransformError, (err) => {
      // Unroll the error thrown from within the transform
      throw err.cause
    })
    .catch(isRetriableError, (err) => {
      if (retryIndex >= DELAYS.length) {
        throw err
      }

      const delayMs = DELAYS[retryIndex]

      errors.warning(
        'CLOUD_API_RESPONSE_FAILED_RETRYING', {
          delayMs,
          tries: DELAYS.length - retryIndex,
          response: err,
        },
      )

      retryIndex++

      return Bluebird
      .delay(delayMs)
      .then(() => {
        debug(`retry #${retryIndex} after ${delayMs}ms`)

        return attempt(retryIndex)
      })
    })
  }

  return attempt(0)
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
// including decryption errors
const isRetriableError = (err) => {
  if (err instanceof DecryptionError) {
    return false
  }

  return err instanceof Bluebird.TimeoutError ||
    (err.statusCode >= 500 && err.statusCode < 600) ||
    (err.statusCode == null)
}

export type CreateRunOptions = {
  projectRoot: string
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
  project: ProjectBase
}

type CreateRunResponse = {
  groupId: string
  machineId: string
  runId: string
  tags: string[] | null
  runUrl: string
  warnings: (Record<string, unknown> & {
    code: string
    message: string
    name: string
  })[]
  captureProtocolUrl?: string | undefined
  capture?: {
    url?: string
    tags: string[] | null
    mountVersion?: number
    disabledMessage?: string
  } | undefined
}

export type ArtifactMetadata = {
  url: string
  fileSize?: number | bigint
  uploadDuration?: number
  success: boolean
  error?: string
  errorStack?: string
}

export type ProtocolMetadata = ArtifactMetadata & {
  specAccess?: {
    size: number
    offset: number
  }
  afterSpecDurations?: AfterSpecDurations & {
    afterSpecTotal: number
  }
}

export type UpdateInstanceArtifactsPayload = {
  screenshots: ArtifactMetadata[]
  video?: ArtifactMetadata
  protocol?: ProtocolMetadata
}

type UpdateInstanceArtifactsOptions = {
  runId: string
  instanceId: string
  timeout?: number
}

let preflightResult = {
  encrypt: true,
}

let recordRoutes = apiRoutes

// Potential todos: Refactor to named exports, refactor away from `this.` in exports,
// move individual exports to their own files & convert this to barrelfile

export default {
  rp,

  // For internal testing
  setPreflightResult (toSet) {
    preflightResult = {
      ...preflightResult,
      ...toSet,
    }
  },

  resetPreflightResult () {
    recordRoutes = apiRoutes
    preflightResult = {
      encrypt: true,
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

  createRun (options: CreateRunOptions) {
    const preflightOptions = _.pick(options, ['projectId', 'projectRoot', 'ciBuildId', 'browser', 'testingType', 'parallel', 'timeout'])

    return this.sendPreflight(preflightOptions)
    .then((result) => {
      const { warnings } = result

      return retryWithBackoff((attemptIndex) => {
        const body = {
          ..._.pick(options, [
            'autoCancelAfterFailures',
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
          timeout: options.timeout ?? SIXTY_SECONDS,
          headers: {
            'x-route-version': '4',
            'x-cypress-request-attempt': attemptIndex,
          },
        })
        .tap((result) => {
          // Tack on any preflight warnings prior to run warnings
          if (warnings) {
            result.warnings = warnings.concat(result.warnings ?? [])
          }
        })
      })
    })
    .then(async (result: CreateRunResponse) => {
      const protocolManager = new ProtocolManager()

      const captureProtocolUrl = result.capture?.url || result.captureProtocolUrl

      options.project.protocolManager = protocolManager

      debugProtocol({ captureProtocolUrl })

      let script

      try {
        const protocolUrl = captureProtocolUrl || process.env.CYPRESS_LOCAL_PROTOCOL_PATH

        if (protocolUrl) {
          script = await this.getCaptureProtocolScript(protocolUrl)
        }
      } catch (e) {
        debugProtocol('Error downloading capture code', e)
        const error = new Error(`Error downloading capture code: ${e.message}`)

        if (CAPTURE_ERRORS) {
          protocolManager.addFatalError('getCaptureProtocolScript', error, [result.captureProtocolUrl])
        } else {
          throw e
        }
      }

      if (script) {
        const config = options.project.getConfig()

        await options.project.protocolManager.setupProtocol(script, {
          runId: result.runId,
          projectId: options.projectId,
          testingType: options.testingType,
          cloudApi: {
            url: apiUrl,
            retryWithBackoff: this.retryWithBackoff,
            requestPromise: this.rp,
          },
          projectConfig: _.pick(config, ['devServerPublicPathRoute', 'port', 'proxyUrl', 'namespace']),
          mountVersion: runnerCapabilities.protocolMountVersion,
        })
      }

      return result
    })
    .catch(RequestErrors.StatusCodeError, formatResponseBody)
    .catch(tagError)
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
        timeout: timeout ?? SIXTY_SECONDS,
        headers: {
          'x-route-version': '5',
          'x-cypress-run-id': runId,
          'x-cypress-request-attempt': attemptIndex,
        },
      })
    })
    .catch(RequestErrors.StatusCodeError, formatResponseBody)
    .catch(tagError)
  },

  postInstanceTests (options) {
    const { instanceId, runId, timeout, ...body } = options

    return retryWithBackoff((attemptIndex) => {
      return rp.post({
        url: recordRoutes.instanceTests(instanceId),
        json: true,
        encrypt: preflightResult.encrypt,
        timeout: timeout ?? SIXTY_SECONDS,
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
        timeout: options.timeout ?? SIXTY_SECONDS,
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

  updateInstanceArtifacts (options: UpdateInstanceArtifactsOptions, body: UpdateInstanceArtifactsPayload) {
    debug('PUT %s %o', recordRoutes.instanceArtifacts(options.instanceId), body)

    return retryWithBackoff((attemptIndex) => {
      return rp.put({
        url: recordRoutes.instanceArtifacts(options.instanceId),
        json: true,
        timeout: options.timeout ?? SIXTY_SECONDS,
        body,
        headers: {
          'x-route-version': '1',
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
        timeout: options.timeout ?? SIXTY_SECONDS,
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
    return Bluebird.join(
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

  sendPreflight (preflightInfo) {
    return retryWithBackoff(async (attemptIndex) => {
      const { timeout, projectRoot } = preflightInfo

      preflightInfo = _.omit(preflightInfo, 'timeout', 'projectRoot')

      const preflightBaseProxy = apiUrl.replace('api', 'api-proxy')

      const envInformation = await getEnvInformationForProjectRoot(projectRoot, process.pid.toString())
      const makeReq = ({ baseUrl, agent }) => {
        return rp.post({
          url: `${baseUrl}preflight`,
          body: {
            apiUrl,
            envUrl: envInformation.envUrl,
            dependencies: envInformation.dependencies,
            errors: envInformation.errors,
            ...preflightInfo,
          },
          headers: {
            'x-route-version': '1',
            'x-cypress-request-attempt': attemptIndex,
          },
          timeout: timeout ?? SIXTY_SECONDS,
          json: true,
          encrypt: 'always',
          agent,
        })
        .catch(RequestErrors.TransformError, (err) => {
          // Unroll the error thrown from within the transform
          throw err.cause
        })
      }

      const postReqs = async () => {
        return makeReq({ baseUrl: preflightBaseProxy, agent: null })
        .catch((err) => {
          if (err.statusCode === 412) {
            throw err
          }

          return makeReq({ baseUrl: apiUrl, agent })
        })
      }

      const result = await postReqs()

      preflightResult = result // { encrypt: boolean, apiUrl: string }
      recordRoutes = makeRoutes(result.apiUrl)

      return result
    })
  },

  async getCaptureProtocolScript (url: string) {
    // TODO(protocol): Ensure this is removed in production
    if (process.env.CYPRESS_LOCAL_PROTOCOL_PATH) {
      debugProtocol(`Loading protocol via script at local path %s`, process.env.CYPRESS_LOCAL_PROTOCOL_PATH)

      return fs.promises.readFile(process.env.CYPRESS_LOCAL_PROTOCOL_PATH, 'utf8')
    }

    const res = await retryWithBackoff(async (attemptIndex) => {
      return rp.get({
        url,
        headers: {
          'x-route-version': '1',
          'x-cypress-request-attempt': attemptIndex,
          'x-cypress-signature': PUBLIC_KEY_VERSION,
        },
        agent,
        encrypt: 'signed',
        resolveWithFullResponse: true,
      })
    })

    const verified = enc.verifySignature(res.body, res.headers['x-cypress-signature'])

    if (!verified) {
      debugProtocol(`Unable to verify protocol signature %s`, url)

      throw new Error('Unable to verify protocol signature')
    }

    debugProtocol(`Loaded protocol via url %s`, url)

    return res.body
  },

  retryWithBackoff,

  publicKeyVersion: PUBLIC_KEY_VERSION,
}
