import crypto from 'crypto'
import * as jose from 'jose'
import base64Url from 'base64url'
import nock from 'nock'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import _ from 'lodash'
import os from 'os'
import * as encryption from '../../../../lib/cloud/encryption'
import { filterRuntimeConfigForRecording } from '../../../../lib/config'

import { agent } from '@packages/network'
import pkg from '@packages/root'
import api from '../../../../lib/cloud/api'
import { cache } from '../../../../lib/cache'
import * as errors from '../../../../lib/errors'
import * as machineId from '../../../../lib/cloud/machine_id'
import Promise from 'bluebird'
import { PROTOCOL_STUB_VALID } from '@tooling/system-tests/lib/protocol-stubs/protocolStubResponse'

const API_BASEURL = 'http://localhost:1234'
const API_PROD_BASEURL = 'https://api.cypress.io'
const API_PROD_PROXY_BASEURL = 'https://api-proxy.cypress.io'
const CLOUD_BASEURL = 'http://localhost:3000'
const AUTH_URLS = {
  'dashboardAuthUrl': 'http://localhost:3000/test-runner.html',
  'dashboardSignupUrl': 'http://localhost:3000/test-runner-signup',
  'dashboardLogoutUrl': 'http://localhost:3000/logout',
}

const makeError = (details: Record<string, any> = {}) => {
  return _.extend(new Error(details.message || 'Some error'), details)
}

const OS_PLATFORM = 'linux'

const rejectsExceptOnCall = (err: unknown, resolvingCall: number) => {
  const fn = vi.fn().mockRejectedValue(err)

  for (let i = 0; i < resolvingCall; i++) {
    fn.mockRejectedValueOnce(err)
  }

  return fn.mockResolvedValueOnce(undefined)
}

const encryptRequest = encryption.encryptRequest

const decryptReqBodyAndRespond = ({ reqBody, resBody }, fn) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })

  /**
   * @type {crypto.KeyObject}
   */
  let _secretKey

  const encryptRequestSpy = vi.spyOn(encryption, 'encryptRequest').mockImplementation(async (params) => {
    if (reqBody) {
      expect(params.body).toStrictEqual(reqBody)
    }

    const { secretKey, jwe } = await encryptRequest(params, { publicKey })

    if (fn) {
      encryptRequestSpy.mockRestore()
    }

    _secretKey = secretKey

    return { secretKey, jwe }
  })

  return async (uri, encReqBody) => {
    const decryptedSecretKey = crypto.createSecretKey(
      crypto.privateDecrypt(
        privateKey,
        Buffer.from(base64Url.toBase64(encReqBody.recipients[0].encrypted_key), 'base64'),
      ),
    )

    expect(_secretKey.export().toString('utf8')).toBe(decryptedSecretKey.export().toString('utf8'))

    const enc = new jose.GeneralEncrypt(
      Buffer.from(JSON.stringify(resBody)),
    )

    enc.setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' }).addRecipient(decryptedSecretKey)

    const jweResponse = await enc.encrypt()

    fn && fn()

    return jweResponse
  }
}

const preflightNock = (baseUrl) => {
  return nock(baseUrl)
  .matchHeader('x-route-version', '1')
  .matchHeader('x-os-name', OS_PLATFORM)
  .matchHeader('x-cypress-version', pkg.version)
  .post('/preflight')
}

const originalEnv = { ...process.env }
let oldEnv: NodeJS.ProcessEnv | undefined

describe('lib/cloud/api', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    api.setPreflightResult({ encrypt: false })

    preflightNock(API_BASEURL)
    .reply(200, decryptReqBodyAndRespond({
      resBody: {
        encrypt: false,
        apiUrl: `${API_BASEURL}/`,
      },
    }))

    nock(API_BASEURL)
    .matchHeader('x-route-version', '2')
    .get('/auth')
    .reply(200, AUTH_URLS)

    api.clearCache()
    vi.spyOn(os, 'platform').mockReturnValue(OS_PLATFORM)

    if (oldEnv) {
      process.env = oldEnv
    }

    oldEnv = Object.assign({}, process.env)

    process.env.DISABLE_API_RETRIES = 'true'

    vi.spyOn(cache, 'getUser').mockResolvedValue({
      name: 'foo bar',
      email: 'foo@bar',
      //authToken: 'auth-token-123'
    })
  })

  afterEach(() => {
    api.resetPreflightResult()
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    process.env = { ...originalEnv }
  })

  describe('.rp', () => {
    beforeEach(() => {
      vi.spyOn(agent, 'addRequest')

      nock.enableNetConnect()
    }) // nock will prevent requests from reaching the agent

    it('makes calls using the correct agent', () => {
      nock.cleanAll()

      return api.ping()
      .thenThrow()
      .catch(() => {
        expect(agent.addRequest).toHaveBeenCalledOnce()

        expect(agent.addRequest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
          href: 'http://localhost:1234/ping',
        }))
      })
    })

    it('sets rejectUnauthorized on the request', () => {
      nock.cleanAll()

      return api.ping()
      .thenThrow()
      .catch(() => {
        expect(agent.addRequest).toHaveBeenCalledOnce()

        expect(agent.addRequest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
          rejectUnauthorized: true,
        }))
      })
    })

    describe('with a proxy defined', () => {
      beforeEach(() => {
        nock.cleanAll()
      })

      it('makes calls using the correct agent', () => {
        process.env.HTTP_PROXY = (process.env.HTTPS_PROXY = 'http://foo.invalid:1234')
        process.env.NO_PROXY = ''

        return api.ping()
        .thenThrow()
        .catch(() => {
          expect(agent.addRequest).toHaveBeenCalledOnce()

          expect(agent.addRequest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            href: 'http://localhost:1234/ping',
          }))
        })
      })
    })
  })

  describe('.ping', () => {
    it('GET /ping', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .get('/ping')
      .reply(200, 'OK')

      return api.ping()
      .then((resp) => {
        expect(resp).toBe('OK')
      })
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .get('/ping')
      .reply(500, {})

      return api.ping()
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.sendPreflight', () => {
    let prodApi
    let originalCypressConfigEnv = process.env.CYPRESS_CONFIG_ENV
    let originalCypressAPIUrl = process.env.CYPRESS_API_URL

    beforeEach(async () => {
      nock.cleanAll()
      vi.restoreAllMocks()
      vi.spyOn(os, 'platform').mockReturnValue(OS_PLATFORM)

      process.env.CYPRESS_CONFIG_ENV = 'production'
      process.env.CYPRESS_API_URL = 'https://some.server.com'

      if (!prodApi) {
        // A fresh api instance under the production env; encryption stays shared so
        // decryptReqBodyAndRespond's spy reaches it.
        vi.resetModules()
        vi.doMock('../../../../lib/cloud/encryption', () => encryption)
        prodApi = (await import('../../../../lib/cloud/api')).default
        vi.doUnmock('../../../../lib/cloud/encryption')
      }

      prodApi.resetPreflightResult()
    }, 30000)

    afterEach(() => {
      if (originalCypressConfigEnv) {
        process.env.CYPRESS_CONFIG_ENV = originalCypressConfigEnv
      } else {
        delete process.env.CYPRESS_CONFIG_ENV
      }

      if (originalCypressAPIUrl) {
        process.env.CYPRESS_API_URL = originalCypressAPIUrl
      } else {
        delete process.env.CYPRESS_API_URL
      }
    })

    it('POST /preflight to proxy. returns encryption', () => {
      preflightNock(API_PROD_PROXY_BASEURL)
      .reply(200, decryptReqBodyAndRespond({
        reqBody: {
          envUrl: 'https://some.server.com',
          dependencies: {},
          errors: [],
          apiUrl: 'https://api.cypress.io/',
          projectId: 'abc123',
        },
        resBody: {
          encrypt: true,
          apiUrl: `${API_PROD_BASEURL}/`,
        },
      }))

      return prodApi.sendPreflight({ projectId: 'abc123' })
      .then((ret) => {
        expect(ret).toStrictEqual({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
      })
    })

    it('POST /preflight to proxy, and then api on response status code failure. returns encryption', () => {
      const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
      .reply(500)

      const scopeApi = preflightNock(API_PROD_BASEURL)
      .reply(200, decryptReqBodyAndRespond({
        reqBody: {
          envUrl: 'https://some.server.com',
          dependencies: {},
          errors: [],
          apiUrl: 'https://api.cypress.io/',
          projectId: 'abc123',
        },
        resBody: {
          encrypt: true,
          apiUrl: `${API_PROD_BASEURL}/`,
        },
      }))

      return prodApi.sendPreflight({ projectId: 'abc123' })
      .then((ret) => {
        scopeProxy.done()
        scopeApi.done()
        expect(ret).toStrictEqual({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
      })
    })

    it('POST /preflight to proxy, and then api on network failure. returns encryption', () => {
      const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
      .replyWithError('some request error')

      const scopeApi = preflightNock(API_PROD_BASEURL)
      .reply(200, decryptReqBodyAndRespond({
        reqBody: {
          envUrl: 'https://some.server.com',
          dependencies: {},
          errors: [],
          apiUrl: 'https://api.cypress.io/',
          projectId: 'abc123',
        },
        resBody: {
          encrypt: true,
          apiUrl: `${API_PROD_BASEURL}/`,
        },
      }))

      return prodApi.sendPreflight({ projectId: 'abc123' })
      .then((ret) => {
        scopeProxy.done()
        scopeApi.done()
        expect(ret).toStrictEqual({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
      })
    })

    it('sets timeout to 5 seconds when no CYPRESS_INITIAL_PREFLIGHT_TIMEOUT env is set', () => {
      vi.spyOn(api.rp, 'post').mockResolvedValue({})

      return api.sendPreflight({})
      .then(() => {
        expect(api.rp.post).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5000 }))
      })
    })

    describe('when CYPRESS_INITIAL_PREFLIGHT_TIMEOUT env is set to a negative number', () => {
      const configuredTimeout = -1
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT
        process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = String(configuredTimeout)
      })

      afterEach(() => {
        process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = prevEnv
      })

      it('skips the no-agent preflight request', () => {
        preflightNock(API_PROD_PROXY_BASEURL)
        .replyWithError('should not be called')

        preflightNock(API_PROD_BASEURL)
        .reply(200, decryptReqBodyAndRespond({
          reqBody: {
            envUrl: 'https://some.server.com',
            dependencies: {},
            errors: [],
            apiUrl: 'https://api.cypress.io/',
            projectId: 'abc123',
          },
          resBody: {
            encrypt: true,
            apiUrl: `${API_PROD_BASEURL}/`,
          },
        }))

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then((ret) => {
          expect(ret).toStrictEqual({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
        })
      })
    })

    describe('when CYPRESS_INITIAL_PREFLIGHT_TIMEOUT env is set to a positive number', () => {
      const configuredTimeout = 10000
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT
        process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = String(configuredTimeout)
      })

      afterEach(() => {
        process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = prevEnv
        vi.mocked(api.rp.post).mockRestore()
      })

      it('makes the initial request with the number set in the env', () => {
        vi.spyOn(api.rp, 'post').mockResolvedValue({})

        return api.sendPreflight({})
        .then(() => {
          expect(api.rp.post).toHaveBeenCalledWith(expect.objectContaining({ timeout: configuredTimeout }))
        })
      })
    })

    describe('errors', () => {
      it('[F1] POST /preflight TimeoutError', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .delayConnection(5000)
        .reply(200, {})

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .delayConnection(5000)
        .reply(200, {})

        return prodApi.sendPreflight({
          projectId: 'abc123',
          timeout: 100,
        })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err.message).toBe('Error: ESOCKETTIMEDOUT')
        })
      })

      it('[F1] POST /preflight RequestError', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .replyWithError('first request error')

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .replyWithError('2nd request error')

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).not.toHaveProperty('statusCode')
          expect(err).toMatchObject({
            name: 'RequestError',
            message: 'Error: 2nd request error',
          })
        })
      })

      it('[F1] POST /preflight statusCode >= 500', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(500)

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(500)

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).toMatchObject({
            name: 'StatusCodeError',
            statusCode: 500,
          })
        })
      })

      it('[F2] POST /preflight statusCode = 404', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(404)

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(404, '<html>404 not found</html>', {
          'Content-Type': 'text/html',
        })

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).toMatchObject({
            name: 'StatusCodeError',
            statusCode: 404,
          })
        })
      })

      it('[F3] POST /preflight statusCode = 422 but decrypt error', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(422, { data: 'very encrypted and secure string' })

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(422, { data: 'very encrypted and secure string' })

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).not.toHaveProperty('statusCode')
          expect(err).toHaveProperty('name', 'DecryptionError')
          expect(err).toHaveProperty('message', 'JWE Recipients missing or incorrect type')
        })
      })

      it('[F3] POST /preflight statusCode = 200 but decrypt error', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(200, { data: 'very encrypted and secure string' })

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(201, 'very encrypted and secure string')

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).not.toHaveProperty('statusCode')
          expect(err).toHaveProperty('name', 'DecryptionError')
          expect(err).toHaveProperty('message', 'General JWE must be an object')
        })
      })

      it('[F3] POST /preflight statusCode = 201 but no body', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(200)

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(201)

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          scopeApi.done()

          expect(err).not.toHaveProperty('statusCode')
          expect(err).toHaveProperty('name', 'DecryptionError')
          expect(err).toHaveProperty('message', 'General JWE must be an object')
        })
      })

      it('[F4] POST /preflight statusCode = 412 valid decryption', () => {
        const scopeProxy = preflightNock(API_PROD_PROXY_BASEURL)
        .reply(412, decryptReqBodyAndRespond({
          reqBody: {
            envUrl: 'https://some.server.com',
            dependencies: {},
            errors: [],
            apiUrl: 'https://api.cypress.io/',
            projectId: 'abc123',
          },
          resBody: {
            message: 'Recording is not working',
            errors: [
              'attempted to send invalid data',
            ],
            object: {
              projectId: 'cy12345',
            },
          },
        }))

        const scopeApi = preflightNock(API_PROD_BASEURL)
        .reply(200)

        return prodApi.sendPreflight({ projectId: 'abc123' })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          scopeProxy.done()
          expect(scopeApi.isDone()).toBe(false)

          expect(err).toMatchObject({
            name: 'StatusCodeError',
            message: '412 - {"message":"Recording is not working","errors":["attempted to send invalid data"],"object":{"projectId":"cy12345"}}',
            statusCode: 412,
          })
        })
      })
    })
  })

  describe('.createRun', () => {
    let protocolManager: { prepareAndSetupProtocol: Mock }
    let buildProps

    beforeEach(() => {
      protocolManager = {
        prepareAndSetupProtocol: vi.fn(),
      }

      buildProps = {
        group: null,
        parallel: null,
        ciBuildId: null,
        projectId: 'id-123',
        recordKey: 'token-123',
        testingType: 'e2e',
        ci: {
          provider: 'circle',
          buildNumber: '987',
          params: { foo: 'bar' },
        },
        platform: {},
        commit: {
          sha: 'sha',
          branch: 'master',
          authorName: 'brian',
          authorEmail: 'brian@cypress.io',
          message: 'such hax',
          remoteOrigin: 'https://github.com/foo/bar.git',
        },
        specs: ['foo.js', 'bar.js'],
        runnerCapabilities: {
          'protocolMountVersion': 2,
          'dynamicSpecsInSerialMode': true,
          'skipSpecAction': true,
          'filterTestsAction': true,
        },
      }
    })

    it('POST /runs + returns runId', () => {
      nock(API_BASEURL)
      .get('/capture-protocol/script/protocolStub.js')
      .reply(200, PROTOCOL_STUB_VALID.compressed, {
        'x-cypress-signature': PROTOCOL_STUB_VALID.sign,
        'Content-Encoding': 'gzip',
      })

      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', buildProps)
      .reply(200, {
        runId: 'new-run-id-123',
        capture: {
          url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
        },
      })

      const project = {
        set protocolManager (val) {
          // don't override with the setter so that the protocol manager is always the same
        },
        get protocolManager () {
          return protocolManager
        },
        getConfig: () => {
          return {
            port: 1234,
            devServerPublicPathRoute: '/dev-server',
            proxyUrl: 'http://localhost:1234',
            namespace: '__cypress',
          }
        },
        get configDebugData () {
          return {
            filePreprocessorHandlerText: 'function () {}',
          }
        },
      }

      return api.createRun({
        ...buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).toStrictEqual({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(protocolManager.prepareAndSetupProtocol).toHaveBeenCalledWith(
          PROTOCOL_STUB_VALID.value,
          {
            runId: 'new-run-id-123',
            testingType: 'e2e',
            mountVersion: 2,
            projectId: 'id-123',
            cloudApi: {
              url: 'http://localhost:1234/',
              retryWithBackoff: api.retryWithBackoff,
              requestPromise: api.rp,
            },
            projectConfig: {
              port: 1234,
              devServerPublicPathRoute: '/dev-server',
              proxyUrl: 'http://localhost:1234',
              namespace: '__cypress',
            },
            debugData: {
              filePreprocessorHandlerText: 'function () {}',
            },
            mode: 'record',
          },
        )
      })
    })

    it('POST /runs + returns runId with encryption', () => {
      nock.cleanAll()
      vi.restoreAllMocks()
      vi.spyOn(os, 'platform').mockReturnValue(OS_PLATFORM)

      nock(API_BASEURL)
      .get('/capture-protocol/script/protocolStub.js')
      .reply(200, PROTOCOL_STUB_VALID.compressed, {
        'x-cypress-signature': PROTOCOL_STUB_VALID.sign,
        'Content-Encoding': 'gzip',
      })

      preflightNock(API_BASEURL)
      .reply(200, decryptReqBodyAndRespond({
        resBody: {
          encrypt: true,
          apiUrl: `${API_BASEURL}/`,
        },
      }, () => {
        nock(API_BASEURL)
        .defaultReplyHeaders({ 'x-cypress-encrypted': 'true' })
        .matchHeader('x-route-version', '4')
        .matchHeader('x-os-name', OS_PLATFORM)
        .matchHeader('x-cypress-version', pkg.version)
        .post('/runs')
        .reply(200, decryptReqBodyAndRespond({
          reqBody: buildProps,
          resBody: {
            runId: 'new-run-id-123',
            capture: {
              url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
            },
          },
        }))
      }))

      const project = {
        set protocolManager (val) {
          // don't override with the setter so that the protocol manager is always the same
        },
        get protocolManager () {
          return protocolManager
        },
        getConfig: () => {
          return {
            port: 1234,
            devServerPublicPathRoute: '/dev-server',
            proxyUrl: 'http://localhost:1234',
            namespace: '__cypress',
          }
        },
        configDebugData: {
          filePreprocessorHandlerText: 'function () {}',
        },
      }

      return api.createRun({
        ...buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).toStrictEqual({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(protocolManager.prepareAndSetupProtocol).toHaveBeenCalledWith(
          PROTOCOL_STUB_VALID.value,
          {
            runId: 'new-run-id-123',
            testingType: 'e2e',
            mountVersion: 2,
            projectId: 'id-123',
            cloudApi: {
              url: 'http://localhost:1234/',
              retryWithBackoff: api.retryWithBackoff,
              requestPromise: api.rp,
            },
            projectConfig: {
              port: 1234,
              devServerPublicPathRoute: '/dev-server',
              proxyUrl: 'http://localhost:1234',
              namespace: '__cypress',
            },
            debugData: {
              filePreprocessorHandlerText: 'function () {}',
            },
            mode: 'record',
          },
        )
      })
    })

    it('POST /runs does not call prepareAndSetupProtocol with invalid signature', () => {
      nock(API_BASEURL)
      .get('/capture-protocol/script/protocolStub.js')
      .reply(200, PROTOCOL_STUB_VALID.compressed, {
        'x-cypress-signature': 'invalid',
        'Content-Encoding': 'gzip',
      })

      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', buildProps)
      .reply(200, {
        runId: 'new-run-id-123',
        capture: {
          url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
        },
      })

      const project = {
        set protocolManager (val) {
          // don't override with the setter so that the protocol manager is always the same
        },
        get protocolManager () {
          return protocolManager
        },
      }

      return api.createRun({
        ...buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).toStrictEqual({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(protocolManager.prepareAndSetupProtocol).not.toHaveBeenCalled()
      })
    })

    it('POST /runs failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', buildProps)
      .reply(422, {
        errors: {
          runId: ['is required'],
        },
      })

      return api.createRun({
        ...buildProps,
        protocolManager: protocolManager,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe(`\
422

{
  "errors": {
    "runId": [
      "is required"
    ]
  }
}\
`)

        expect(protocolManager.prepareAndSetupProtocol).not.toHaveBeenCalled()
      })
    })

    it('handles timeouts', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs')
      .delayConnection(5000)
      .reply(200, {})

      return api.createRun({
        timeout: 100,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 10 seconds', () => {
      vi.spyOn(api.rp, 'post').mockResolvedValue({ runId: 'foo' })

      const project = {
        set protocolManager (val) {
          // don't override with the setter so that the protocol manager is always the same
        },
        get protocolManager () {
          return protocolManager
        },
      }

      return api.createRun({ project })
      .then(() => {
        expect(api.rp.post).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60000 }))
      })
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/runs', buildProps)
      .reply(500, {})

      return api.createRun({
        ...buildProps,
        protocolManager: protocolManager,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
        expect(protocolManager.prepareAndSetupProtocol).not.toHaveBeenCalled()
      })
    })

    it('tags errors on /preflight', () => {
      preflightNock(API_BASEURL)
      .times(2)
      .reply(500, {})

      return api.createRun({})
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.postInstanceTests', () => {
    let props
    let bodyProps

    beforeEach(() => {
      props = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
        config: {},
        tests: [],
        hooks: [],
      }

      bodyProps = _.omit(props, 'instanceId', 'runId')
    })

    it('POSTs /instances/:id/tests', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', props.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests', bodyProps)
      .reply(200)

      return api.postInstanceTests(props)
    })

    it('POSTs /instances/:id/tests strips arbitrarily large config values', () => {
      props.config = {
        projectId: 'abcd1234',
        customBloat: { nested: 'x'.repeat(5000) },
        _myPluginState: { foo: 'bar' },
        devServer: {
          bundler: 'webpack',
          framework: 'react',
          webpackConfig: 'a'.repeat(10000),
          viteConfig: 'a'.repeat(10000),
        },
        env: {
          NUMERIC_VALUE: 1,
          TRUTHY_VALUE: true,
          SOME_REALLY_LONG_VALUE: 'a'.repeat(10000),
        },
        resolved: {
          env: {
            'NUMERIC_VALUE': { 'value': 1, 'from': 'env' },
            'TRUTHY_VALUE': { 'value': true, 'from': 'env' },
            'SOME_REALLY_LONG_VALUE': { 'value': 'a'.repeat(10000), 'from': 'env' },
          },
        },
      }

      props.config.rawJson = _.cloneDeep(props.config)

      const expectedConfig = filterRuntimeConfigForRecording(props.config)

      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', props.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests', {
        ...bodyProps,
        config: expectedConfig,
      })
      .reply(200)

      expect(expectedConfig.projectId).toBe('abcd1234')
      expect(expectedConfig.env).toStrictEqual({
        NUMERIC_VALUE: `omitted: number`,
        TRUTHY_VALUE: `omitted: boolean`,
        SOME_REALLY_LONG_VALUE: `omitted: string`,
      })

      expect(expectedConfig.resolved).toBeUndefined()
      expect(expectedConfig.devServer.webpackConfig).toBe('omitted')
      expect(expectedConfig.devServer.viteConfig).toBe('omitted')
      expect(expectedConfig.customBloat).toBeUndefined()
      expect(expectedConfig._myPluginState).toBeUndefined()

      return api.postInstanceTests(props)
    })

    it('POSTs /instances/:id/tests keeps allowlisted component config keys', () => {
      props.config = {
        projectId: 'abcd1234',
        indexHtmlFile: 'cypress/support/component-index.html',
        devServerConfig: {
          framework: 'react',
          bundler: 'webpack',
          mode: 'development',
          webpackConfig: { entry: 'app' },
        },
      }

      const expectedConfig = filterRuntimeConfigForRecording(props.config)

      expect(expectedConfig.projectId).toBe('abcd1234')
      expect(expectedConfig.indexHtmlFile).toBe('cypress/support/component-index.html')
      expect(expectedConfig.devServerConfig).toStrictEqual({
        framework: 'react',
        bundler: 'webpack',
        mode: 'omitted: string',
        webpackConfig: 'omitted: object',
      })

      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', props.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests', {
        ...bodyProps,
        config: expectedConfig,
      })
      .reply(200)

      return api.postInstanceTests(props)
    })

    it('PUT /instances/:id failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests')
      .reply(422, {
        errors: {
          tests: ['is required'],
        },
      })

      return api.postInstanceTests({ instanceId: 'instance-id-123' })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe(`\
422

{
  "errors": {
    "tests": [
      "is required"
    ]
  }
}\
`)
      })
    })

    it('handles timeouts', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests')
      .delayConnection(5000)
      .reply(200, {})

      return api.postInstanceTests({
        instanceId: 'instance-id-123',
        timeout: 100,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      vi.spyOn(api.rp, 'post').mockResolvedValue(undefined)

      return api.postInstanceTests({})
      .then(() => {
        expect(api.rp.post).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60000 }))
      })
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/instances/instance-id-123/tests', bodyProps)
      .reply(500, {})

      return api.postInstanceTests(props)
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.postInstanceResults', () => {
    let updateProps
    let postProps

    beforeEach(() => {
      updateProps = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
        stats: {},
        error: 'err msg',
        video: true,
        screenshots: [],
        reporterStats: {},
      }

      postProps = _.pick(updateProps, 'stats', 'video', 'screenshots', 'reporterStats')
    })

    it('POSTs /instances/:id/results', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', updateProps.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/results', postProps)
      .reply(200)

      return api.postInstanceResults(updateProps)
    })

    it('PUT /instances/:id failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/results')
      .reply(422, {
        errors: {
          tests: ['is required'],
        },
      })

      return api.postInstanceResults({ instanceId: 'instance-id-123' })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe(`\
422

{
  "errors": {
    "tests": [
      "is required"
    ]
  }
}\
`)
      })
    })

    it('handles timeouts', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/results')
      .delayConnection(5000)
      .reply(200, {})

      return api.postInstanceResults({
        instanceId: 'instance-id-123',
        timeout: 100,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      vi.spyOn(api.rp, 'post').mockResolvedValue(undefined)

      return api.postInstanceResults({})
      .then(() => {
        expect(api.rp.post).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60000 }))
      })
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/instances/instance-id-123/results', postProps)
      .reply(500, {})

      return api.postInstanceResults(updateProps)
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.updateInstanceStdout', () => {
    it('PUTs /instances/:id/stdout', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-run-id', 'run-id-123')
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-cypress-version', pkg.version)
      .put('/instances/instance-id-123/stdout', {
        stdout: 'foobarbaz\n',
      })
      .reply(200)

      return api.updateInstanceStdout({
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
        stdout: 'foobarbaz\n',
      })
    })

    it('PUT /instances/:id/stdout failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .put('/instances/instance-id-123/stdout')
      .reply(422, {
        errors: {
          tests: ['is required'],
        },
      })

      return api.updateInstanceStdout({ instanceId: 'instance-id-123' })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe(`\
422

{
  "errors": {
    "tests": [
      "is required"
    ]
  }
}\
`)
      })
    })

    it('handles timeouts', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .put('/instances/instance-id-123/stdout')
      .delayConnection(5000)
      .reply(200, {})

      return api.updateInstanceStdout({
        instanceId: 'instance-id-123',
        timeout: 100,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).toBe('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      vi.spyOn(api.rp, 'put').mockResolvedValue(undefined)

      return api.updateInstanceStdout({})
      .then(() => {
        expect(api.rp.put).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60000 }))
      })
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .put('/instances/instance-id-123/stdout', {
        stdout: 'foobarbaz\n',
      })
      .reply(500, {})

      return api.updateInstanceStdout({
        instanceId: 'instance-id-123',
        stdout: 'foobarbaz\n',
      })
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.getAuthUrls', () => {
    it('GET /auth + returns the urls', () => {
      return api.getAuthUrls().then((urls) => {
        expect(urls).toStrictEqual(AUTH_URLS)
      })
    })

    it('tags errors', () => {
      nock.cleanAll()

      nock(API_BASEURL)
      .matchHeader('accept-encoding', /gzip/)
      .matchHeader('x-route-version', '2')
      .get('/auth')
      .reply(500, {})

      return api.getAuthUrls()
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })

    it('caches the response from the first request', () => {
      return api.getAuthUrls()
      .then(() => {
        // nock will throw if this makes a second HTTP call
        return api.getAuthUrls()
      }).then((urls) => {
        expect(urls).toStrictEqual(AUTH_URLS)
      })
    })
  })

  describe('.postLogout', () => {
    beforeEach(() => {
      vi.spyOn(machineId, 'machineId').mockResolvedValue('foo')
    })

    it('POSTs /logout', () => {
      nock(CLOUD_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-machine-id', 'foo')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/logout')
      .reply(200)

      return api.postLogout('auth-token-123')
    })

    it('tags errors', () => {
      nock(CLOUD_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-machine-id', 'foo')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/logout')
      .reply(500, {})

      return api.postLogout('auth-token-123')
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.createCrashReport', () => {
    let setup: (body: Record<string, any>, authToken: string, delay?: number) => nock.Scope

    beforeEach(() => {
      setup = (body, authToken, delay = 0) => {
        return nock(API_BASEURL)
        .matchHeader('x-os-name', OS_PLATFORM)
        .matchHeader('x-cypress-version', pkg.version)
        .matchHeader('authorization', `Bearer ${authToken}`)
        .post('/exceptions', body)
        .delayConnection(delay)
        .reply(200)
      }
    })

    it('POSTs /exceptions', () => {
      setup({ foo: 'bar' }, 'auth-token-123')

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123')
    })

    it('by default times outs after 3 seconds', () => {
      // return our own specific promise
      // so we can spy on the timeout function
      const p = Promise.resolve({})

      vi.spyOn(p, 'timeout')
      vi.spyOn(api.rp, 'post').mockReturnValue(p)

      setup({ foo: 'bar' }, 'auth-token-123')

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123').then(() => {
        expect(p.timeout).toHaveBeenCalledWith(3000)
      })
    })

    it('times out after exceeding timeout', () => {
      // force our connection to be delayed 5 seconds
      setup({ foo: 'bar' }, 'auth-token-123', 5000)

      // and set the timeout to only be 50ms
      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123', 50)
      .then(() => {
        throw new Error('errored: it did not catch the timeout error!')
      }).catch(Promise.TimeoutError, () => {})
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/exceptions', { foo: 'bar' })
      .reply(500, {})

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123')
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err).toHaveProperty('isApiError', true)
      })
    })
  })

  describe('.retryWithBackoff', () => {
    beforeEach(() => {
      process.env.DISABLE_API_RETRIES = ''

      vi.spyOn(Promise, 'delay').mockResolvedValue(undefined)
    })

    it('attempts passed-in function', () => {
      const fn = vi.fn()

      return api.retryWithBackoff(fn).then(() => {
        expect(fn).toHaveBeenCalled()
      })
    })

    it('retries if function times out', () => {
      const fn = rejectsExceptOnCall(new Promise.TimeoutError(), 1)

      return api.retryWithBackoff(fn)
      .then(() => {
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn.mock.calls[0][0]).toBe(0)
        expect(fn.mock.calls[1][0]).toBe(1)
      })
    })

    it('retries on 5xx errors', () => {
      const fn1 = rejectsExceptOnCall(makeError({ statusCode: 500 }), 1)

      const fn2 = rejectsExceptOnCall(makeError({ statusCode: 599 }), 1)

      return api.retryWithBackoff(fn1)
      .then(() => {
        expect(fn1).toHaveBeenCalledTimes(2)

        return api.retryWithBackoff(fn2)
      }).then(() => {
        expect(fn2).toHaveBeenCalledTimes(2)
      })
    })

    it('retries on error without status code', () => {
      const fn = rejectsExceptOnCall(makeError(), 1)

      return api.retryWithBackoff(fn)
      .then(() => {
        expect(fn).toHaveBeenCalledTimes(2)
      })
    })

    it('does not retry on non-5xx errors', () => {
      const fn1 = vi.fn().mockRejectedValue(makeError({ message: '499 error', statusCode: 499 }))

      const fn2 = vi.fn().mockRejectedValue(makeError({ message: '600 error', statusCode: 600 }))

      return api.retryWithBackoff(fn1)
      .then(() => {
        throw new Error('Should not resolve 499 error')
      })
      .catch((err) => {
        expect(err.message).toBe('499 error')

        return api.retryWithBackoff(fn2)
      })
      .then(() => {
        throw new Error('Should not resolve 600 error')
      })
      .catch((err) => {
        expect(err.message).toBe('600 error')
      })
    })

    it('does not retry if it is a non retriable cert error', () => {
      const fn1 = vi.fn().mockRejectedValue(makeError({ message: '600 error', statusCode: 600, cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } }))

      return api.retryWithBackoff(fn1)
      .then(() => {
        throw new Error('Should not resolve 600 error')
      })
      .catch((err) => {
        expect(err.message).toBe('600 error')
      })
    })

    it('backs off with strategy: 30s, 60s, 2m', () => {
      const fn = rejectsExceptOnCall(new Promise.TimeoutError(), 3)

      return api.retryWithBackoff(fn).then(() => {
        expect(Promise.delay).toHaveBeenCalledTimes(3)
        expect(Promise.delay).toHaveBeenNthCalledWith(1, 30 * 1000)
        expect(Promise.delay).toHaveBeenNthCalledWith(2, 60 * 1000)

        expect(Promise.delay).toHaveBeenNthCalledWith(3, 2 * 60 * 1000)
      })
    })

    it('fails after third retry fails', () => {
      const fn = vi.fn().mockRejectedValue(makeError({ message: '500 error', statusCode: 500 }))

      return api.retryWithBackoff(fn)
      .then(() => {
        throw new Error('Should not resolve')
      }).catch((err) => {
        expect(err.message).toBe('500 error')
      })
    })

    it('calls errors.warning before each retry', () => {
      const err = makeError({ message: '500 error', statusCode: 500 })

      vi.spyOn(errors, 'warning')
      const fn = rejectsExceptOnCall(err, 3)

      return api.retryWithBackoff(fn).then(() => {
        expect(errors.warning).toHaveBeenCalledTimes(3)
        expect(vi.mocked(errors.warning).mock.calls[0][0]).toStrictEqual('CLOUD_API_RESPONSE_FAILED_RETRYING')
        expect(vi.mocked(errors.warning).mock.calls[0][1]).toStrictEqual({
          delay: '30 seconds',
          tries: 3,
          response: err,
        })

        expect(vi.mocked(errors.warning).mock.calls[1][1]).toStrictEqual({
          delay: '1 minute',
          tries: 2,
          response: err,
        })

        expect(vi.mocked(errors.warning).mock.calls[2][1]).toStrictEqual({
          delay: '2 minutes',
          tries: 1,
          response: err,
        })
      })
    })

    it('does not call errors.warning if displayRetryErrors is false', () => {
      const err = makeError({ message: '500 error', statusCode: 500 })

      vi.spyOn(errors, 'warning')
      const fn = rejectsExceptOnCall(err, 3)

      return api.retryWithBackoff(fn, { displayRetryErrors: false }).then(() => {
        expect(errors.warning).not.toHaveBeenCalled()
      })
    })
  })

  describe('.updateInstanceArtifacts', () => {
    let artifactOptions
    let artifactProps

    beforeEach(() => {
      artifactOptions = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
      }

      artifactProps = {
        screenshots: [{
          url: `http://localhost:1234/screenshots/upload/instance-id-123/a877e957-f90e-4ba4-9fa8-569812f148c4.png`,
          uploadSize: 100,
          uploadDuration: 100,
        }],
        video: {
          url: `http://localhost:1234/video/upload/instance-id-123/f17754c4-581d-4e08-a922-1fa402f9c6de.mp4`,
          uploadSize: 122,
          uploadDuration: 100,
        },
        protocol: {
          url: `http://localhost:1234/protocol/upload/instance-id-123/2ed89c81-e7eb-4b97-8a6e-185c410471df.db`,
          uploadSize: 123,
          uploadDuration: 100,
        },
      }
      // TODO: add schema validation
    })

    it('PUTs/instances/:id/artifacts', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', artifactOptions.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', OS_PLATFORM)
      .matchHeader('x-cypress-version', pkg.version)
      .put('/instances/instance-id-123/artifacts', {
        protocol: artifactProps.protocol,
        screenshots: artifactProps.screenshots,
        video: artifactProps.video,
      })
      .reply(200)

      return api.updateInstanceArtifacts(artifactOptions, artifactProps)
    })
  })
})
