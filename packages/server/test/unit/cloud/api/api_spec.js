const crypto = require('crypto')
const jose = require('jose')
const base64Url = require('base64url')
const stealthyRequire = require('stealthy-require')

require('../../../spec_helper')

const _ = require('lodash')
const os = require('os')
const encryption = require('../../../../lib/cloud/encryption')

const {
  agent,
} = require('@packages/network')
const pkg = require('@packages/root')
const api = require('../../../../lib/cloud/api').default
const cache = require('../../../../lib/cache')
const errors = require('../../../../lib/errors')
const machineId = require('../../../../lib/cloud/machine_id')
const Promise = require('bluebird')

const API_BASEURL = 'http://localhost:1234'
const API_PROD_BASEURL = 'https://api.cypress.io'
const API_PROD_PROXY_BASEURL = 'https://api-proxy.cypress.io'
const CLOUD_BASEURL = 'http://localhost:3000'
const AUTH_URLS = {
  'dashboardAuthUrl': 'http://localhost:3000/test-runner.html',
  'dashboardLogoutUrl': 'http://localhost:3000/logout',
}

const {
  PROTOCOL_STUB_VALID,
} = require('@tooling/system-tests/lib/protocol-stubs/protocolStubResponse')

const makeError = (details = {}) => {
  return _.extend(new Error(details.message || 'Some error'), details)
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

  sinon.stub(encryption, 'encryptRequest').callsFake(async (params) => {
    if (reqBody) {
      expect(params.body).to.deep.eq(reqBody)
    }

    const { secretKey, jwe } = await encryptRequest(params, publicKey)

    if (fn) {
      encryption.encryptRequest.restore()
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

    expect(_secretKey.export().toString('utf8')).to.eq(decryptedSecretKey.export().toString('utf8'))

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
  .matchHeader('x-os-name', 'linux')
  .matchHeader('x-cypress-version', pkg.version)
  .post('/preflight')
}

describe('lib/cloud/api', () => {
  beforeEach(() => {
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
    sinon.stub(os, 'platform').returns('linux')

    if (this.oldEnv) {
      process.env = this.oldEnv
    }

    this.oldEnv = Object.assign({}, process.env)

    process.env.DISABLE_API_RETRIES = true

    return sinon.stub(cache, 'getUser').resolves({
      name: 'foo bar',
      email: 'foo@bar',
      //authToken: 'auth-token-123'
    })
  })

  afterEach(() => {
    api.resetPreflightResult()
  })

  context('.rp', () => {
    beforeEach(() => {
      sinon.spy(agent, 'addRequest')

      return nock.enableNetConnect()
    }) // nock will prevent requests from reaching the agent

    it('makes calls using the correct agent', () => {
      nock.cleanAll()

      return api.ping()
      .thenThrow()
      .catch(() => {
        expect(agent.addRequest).to.be.calledOnce

        expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
          href: 'http://localhost:1234/ping',
        })
      })
    })

    it('sets rejectUnauthorized on the request', () => {
      nock.cleanAll()

      return api.ping()
      .thenThrow()
      .catch(() => {
        expect(agent.addRequest).to.be.calledOnce

        expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
          rejectUnauthorized: true,
        })
      })
    })

    context('with a proxy defined', () => {
      beforeEach(function () {
        nock.cleanAll()
      })

      it('makes calls using the correct agent', () => {
        process.env.HTTP_PROXY = (process.env.HTTPS_PROXY = 'http://foo.invalid:1234')
        process.env.NO_PROXY = ''

        return api.ping()
        .thenThrow()
        .catch(() => {
          expect(agent.addRequest).to.be.calledOnce

          expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
            href: 'http://localhost:1234/ping',
          })
        })
      })
    })
  })

  context('.ping', () => {
    it('GET /ping', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .get('/ping')
      .reply(200, 'OK')

      return api.ping()
      .then((resp) => {
        expect(resp).to.eq('OK')
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
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.sendPreflight', () => {
    let prodApi

    beforeEach(function () {
      this.timeout(30000)

      nock.cleanAll()
      sinon.restore()
      sinon.stub(os, 'platform').returns('linux')

      process.env.CYPRESS_CONFIG_ENV = 'production'
      process.env.CYPRESS_API_URL = 'https://some.server.com'

      if (!prodApi) {
        prodApi = stealthyRequire(require.cache, () => {
          return require('../../../../lib/cloud/api').default
        }, () => {
          require('../../../../lib/cloud/encryption')
        }, module)
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
        expect(ret).to.deep.eq({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
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
        expect(ret).to.deep.eq({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
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
        expect(ret).to.deep.eq({ encrypt: true, apiUrl: `${API_PROD_BASEURL}/` })
      })
    })

    it('sets timeout to 60 seconds', () => {
      sinon.stub(api.rp, 'post').resolves({})

      return api.sendPreflight({})
      .then(() => {
        expect(api.rp.post).to.be.calledWithMatch({ timeout: 60000 })
      })
    })

    describe('errors', () => {
      it('[F1] POST /preflight TimeoutError', () => {
        preflightNock(API_BASEURL)
        .times(2)
        .delayConnection(5000)
        .reply(200, {})

        return api.sendPreflight({
          timeout: 100,
        })
        .then(() => {
          throw new Error('should have thrown here')
        })
        .catch((err) => {
          expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
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

          expect(err).not.to.have.property('statusCode')
          expect(err).to.contain({
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

          expect(err).to.contain({
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

          expect(err).to.contain({
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

          expect(err).not.to.have.property('statusCode')
          expect(err).to.contain({
            name: 'DecryptionError',
            message: 'JWE Recipients missing or incorrect type',
          })
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

          expect(err).not.to.have.property('statusCode')
          expect(err).to.contain({
            name: 'DecryptionError',
            message: 'General JWE must be an object',
          })
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

          expect(err).not.to.have.property('statusCode')
          expect(err).to.contain({
            name: 'DecryptionError',
            message: 'General JWE must be an object',
          })
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
          expect(scopeApi.isDone()).to.be.false

          expect(err).to.contain({
            name: 'StatusCodeError',
            message: '412 - {"message":"Recording is not working","errors":["attempted to send invalid data"],"object":{"projectId":"cy12345"}}',
            statusCode: 412,
          })
        })
      })
    })
  })

  context('.createRun', () => {
    beforeEach(function () {
      this.protocolManager = {
        setupProtocol: sinon.stub(),
      }

      this.buildProps = {
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
        },
      }
    })

    it('POST /runs + returns runId', function () {
      nock(API_BASEURL)
      .get('/capture-protocol/script/protocolStub.js')
      .reply(200, PROTOCOL_STUB_VALID.compressed, {
        'x-cypress-signature': PROTOCOL_STUB_VALID.sign,
        'Content-Encoding': 'gzip',
      })

      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', this.buildProps)
      .reply(200, {
        runId: 'new-run-id-123',
        capture: {
          url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
        },
      })

      const protocolManager = this.protocolManager
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
      }

      return api.createRun({
        ...this.buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).to.deep.eq({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(this.protocolManager.setupProtocol).to.be.calledWith(
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
          },
        )
      })
    })

    it('POST /runs + returns runId with encryption', function () {
      nock.cleanAll()
      sinon.restore()
      sinon.stub(os, 'platform').returns('linux')

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
        .matchHeader('x-os-name', 'linux')
        .matchHeader('x-cypress-version', pkg.version)
        .post('/runs')
        .reply(200, decryptReqBodyAndRespond({
          reqBody: this.buildProps,
          resBody: {
            runId: 'new-run-id-123',
            capture: {
              url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
            },
          },
        }))
      }))

      const protocolManager = this.protocolManager
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
      }

      return api.createRun({
        ...this.buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).to.deep.eq({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(this.protocolManager.setupProtocol).to.be.calledWith(
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
          },
        )
      })
    })

    it('POST /runs does not call setupProtocol with invalid signature', function () {
      nock(API_BASEURL)
      .get('/capture-protocol/script/protocolStub.js')
      .reply(200, PROTOCOL_STUB_VALID.compressed, {
        'x-cypress-signature': 'invalid',
        'Content-Encoding': 'gzip',
      })

      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', this.buildProps)
      .reply(200, {
        runId: 'new-run-id-123',
        capture: {
          url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
        },
      })

      const protocolManager = this.protocolManager
      const project = {
        set protocolManager (val) {
          // don't override with the setter so that the protocol manager is always the same
        },
        get protocolManager () {
          return protocolManager
        },
      }

      return api.createRun({
        ...this.buildProps,
        project,
      })
      .then((ret) => {
        expect(ret).to.deep.eq({
          runId: 'new-run-id-123',
          capture: {
            url: 'http://localhost:1234/capture-protocol/script/protocolStub.js',
          },
        })

        expect(this.protocolManager.setupProtocol).not.to.be.called
      })
    })

    it('POST /runs failure formatting', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', this.buildProps)
      .reply(422, {
        errors: {
          runId: ['is required'],
        },
      })

      return api.createRun({
        ...this.buildProps,
        protocolManager: this.protocolManager,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).to.eq(`\
422

{
  "errors": {
    "runId": [
      "is required"
    ]
  }
}\
`)

        expect(this.protocolManager.setupProtocol).not.to.be.called
      })
    })

    it('handles timeouts', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 10 seconds', () => {
      sinon.stub(api.rp, 'post').resolves({ runId: 'foo' })

      const protocolManager = this.protocolManager
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
        expect(api.rp.post).to.be.calledWithMatch({ timeout: 60000 })
      })
    })

    it('tags errors', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/runs', this.buildProps)
      .reply(500, {})

      return api.createRun({
        ...this.buildProps,
        protocolManager: this.protocolManager,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
        expect(this.protocolManager.setupProtocol).not.to.be.called
      })
    })

    it('tags errors on /preflight', function () {
      preflightNock(API_BASEURL)
      .times(2)
      .reply(500, {})

      return api.createRun({})
      .then(() => {
        throw new Error('should have thrown here')
      })
      .catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.createInstance', () => {
    beforeEach(function () {
      Object.defineProperty(process.versions, 'chrome', {
        value: '53',
      })

      this.createProps = {
        runId: 'run-id-123',
        spec: 'cypress/integration/app_spec.js',
        groupId: 'groupId123',
        machineId: 'machineId123',
        platform: {},
      }

      this.postProps = _.omit(this.createProps, 'runId')
    })

    it('POSTs /runs/:id/instances', function () {
      os.platform.returns('darwin')

      nock(API_BASEURL)
      .matchHeader('x-route-version', '5')
      .matchHeader('x-cypress-run-id', this.createProps.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', 'darwin')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs/run-id-123/instances', this.postProps)
      .reply(200, {
        instanceId: 'instance-id-123',
      })

      return api.createInstance(this.createProps)
      .get('instanceId')
      .then((instanceId) => {
        expect(instanceId).to.eq('instance-id-123')
      })
    })

    it('POST /runs/:id/instances failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '5')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs/run-id-123/instances')
      .reply(422, {
        errors: {
          tests: ['is required'],
        },
      })

      return api.createInstance({ runId: 'run-id-123' })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).to.eq(`\
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
      .matchHeader('x-route-version', '5')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs/run-id-123/instances')
      .delayConnection(5000)
      .reply(200, {})

      return api.createInstance({
        runId: 'run-id-123',
        timeout: 100,
      })
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      sinon.stub(api.rp, 'post').resolves({
        instanceId: 'instanceId123',
      })

      return api.createInstance({})
      .then(() => {
        expect(api.rp.post).to.be.calledWithMatch({ timeout: 60000 })
      })
    })

    it('tags errors', function () {
      nock(API_BASEURL)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/runs/run-id-123/instances', this.postProps)
      .reply(500, {})

      return api.createInstance(this.createProps)
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.postInstanceTests', () => {
    beforeEach(function () {
      this.props = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
        config: {},
        tests: [],
        hooks: [],
      }

      this.bodyProps = _.omit(this.props, 'instanceId', 'runId')
    })

    it('POSTs /instances/:id/results', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', this.props.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/tests', this.bodyProps)
      .reply(200)

      return api.postInstanceTests(this.props)
    })

    it('PUT /instances/:id failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq(`\
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
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      sinon.stub(api.rp, 'post').resolves()

      return api.postInstanceTests({})
      .then(() => {
        expect(api.rp.post).to.be.calledWithMatch({ timeout: 60000 })
      })
    })

    it('tags errors', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/instances/instance-id-123/tests', this.bodyProps)
      .reply(500, {})

      return api.postInstanceTests(this.props)
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.postInstanceResults', () => {
    beforeEach(function () {
      this.updateProps = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
        stats: {},
        error: 'err msg',
        video: true,
        screenshots: [],
        reporterStats: {},
      }

      this.postProps = _.pick(this.updateProps, 'stats', 'video', 'screenshots', 'reporterStats')
    })

    it('POSTs /instances/:id/results', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', this.updateProps.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/instances/instance-id-123/results', this.postProps)
      .reply(200)

      return api.postInstanceResults(this.updateProps)
    })

    it('PUT /instances/:id failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq(`\
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
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      sinon.stub(api.rp, 'post').resolves()

      return api.postInstanceResults({})
      .then(() => {
        expect(api.rp.post).to.be.calledWithMatch({ timeout: 60000 })
      })
    })

    it('tags errors', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/instances/instance-id-123/results', this.postProps)
      .reply(500, {})

      return api.postInstanceResults(this.updateProps)
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.updateInstanceStdout', () => {
    it('PUTs /instances/:id/stdout', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', 'linux')
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
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq(`\
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
      .matchHeader('x-os-name', 'linux')
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
        expect(err.message).to.eq('Error: ESOCKETTIMEDOUT')
      })
    })

    it('sets timeout to 60 seconds', () => {
      sinon.stub(api.rp, 'put').resolves()

      return api.updateInstanceStdout({})
      .then(() => {
        expect(api.rp.put).to.be.calledWithMatch({ timeout: 60000 })
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
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.getAuthUrls', () => {
    it('GET /auth + returns the urls', () => {
      return api.getAuthUrls().then((urls) => {
        expect(urls).to.deep.eq(AUTH_URLS)
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
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })

    it('caches the response from the first request', () => {
      return api.getAuthUrls()
      .then(() => {
        // nock will throw if this makes a second HTTP call
        return api.getAuthUrls()
      }).then((urls) => {
        expect(urls).to.deep.eq(AUTH_URLS)
      })
    })
  })

  context('.postLogout', () => {
    beforeEach(() => {
      return sinon.stub(machineId, 'machineId').resolves('foo')
    })

    it('POSTs /logout', () => {
      nock(CLOUD_BASEURL)
      .matchHeader('x-os-name', 'linux')
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
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-machine-id', 'foo')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/logout')
      .reply(500, {})

      return api.postLogout('auth-token-123')
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.createCrashReport', () => {
    beforeEach(function () {
      this.setup = (body, authToken, delay = 0) => {
        return nock(API_BASEURL)
        .matchHeader('x-os-name', 'linux')
        .matchHeader('x-cypress-version', pkg.version)
        .matchHeader('authorization', `Bearer ${authToken}`)
        .post('/exceptions', body)
        .delayConnection(delay)
        .reply(200)
      }
    })

    it('POSTs /exceptions', function () {
      this.setup({ foo: 'bar' }, 'auth-token-123')

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123')
    })

    it('by default times outs after 3 seconds', function () {
      // return our own specific promise
      // so we can spy on the timeout function
      const p = Promise.resolve({})

      sinon.spy(p, 'timeout')
      sinon.stub(api.rp, 'post').returns(p)

      this.setup({ foo: 'bar' }, 'auth-token-123')

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123').then(() => {
        expect(p.timeout).to.be.calledWith(3000)
      })
    })

    it('times out after exceeding timeout', function () {
      // force our connection to be delayed 5 seconds
      this.setup({ foo: 'bar' }, 'auth-token-123', 5000)

      // and set the timeout to only be 50ms
      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123', 50)
      .then(() => {
        throw new Error('errored: it did not catch the timeout error!')
      }).catch(Promise.TimeoutError, () => {})
    })

    it('tags errors', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/exceptions', { foo: 'bar' })
      .reply(500, {})

      return api.createCrashReport({ foo: 'bar' }, 'auth-token-123')
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.isApiError).to.be.true
      })
    })
  })

  context('.retryWithBackoff', () => {
    beforeEach(() => {
      process.env.DISABLE_API_RETRIES = ''

      return sinon.stub(Promise, 'delay').resolves()
    })

    it('attempts passed-in function', () => {
      const fn = sinon.stub()

      return api.retryWithBackoff(fn).then(() => {
        expect(fn).to.be.called
      })
    })

    it('retries if function times out', () => {
      const fn = sinon.stub()
      .rejects(new Promise.TimeoutError())

      fn.onCall(1).resolves()

      return api.retryWithBackoff(fn)
      .then(() => {
        expect(fn).to.be.calledTwice
        expect(fn.firstCall.args[0]).eq(0)
        expect(fn.secondCall.args[0]).eq(1)
      })
    })

    it('retries on 5xx errors', () => {
      const fn1 = sinon.stub().rejects(makeError({ statusCode: 500 }))

      fn1.onCall(1).resolves()

      const fn2 = sinon.stub().rejects(makeError({ statusCode: 599 }))

      fn2.onCall(1).resolves()

      return api.retryWithBackoff(fn1)
      .then(() => {
        expect(fn1).to.be.calledTwice

        return api.retryWithBackoff(fn2)
      }).then(() => {
        expect(fn2).to.be.calledTwice
      })
    })

    it('retries on error without status code', () => {
      const fn = sinon.stub().rejects(makeError())

      fn.onCall(1).resolves()

      return api.retryWithBackoff(fn)
      .then(() => {
        expect(fn).to.be.calledTwice
      })
    })

    it('does not retry on non-5xx errors', () => {
      const fn1 = sinon.stub().rejects(makeError({ message: '499 error', statusCode: 499 }))

      const fn2 = sinon.stub().rejects(makeError({ message: '600 error', statusCode: 600 }))

      return api.retryWithBackoff(fn1)
      .then(() => {
        throw new Error('Should not resolve 499 error')
      })
      .catch((err) => {
        expect(err.message).to.equal('499 error')

        return api.retryWithBackoff(fn2)
      })
      .then(() => {
        throw new Error('Should not resolve 600 error')
      })
      .catch((err) => {
        expect(err.message).to.equal('600 error')
      })
    })

    it('backs off with strategy: 30s, 60s, 2m', () => {
      const fn = sinon.stub().rejects(new Promise.TimeoutError())

      fn.onCall(3).resolves()

      return api.retryWithBackoff(fn).then(() => {
        expect(Promise.delay).to.be.calledThrice
        expect(Promise.delay.firstCall).to.be.calledWith(30 * 1000)
        expect(Promise.delay.secondCall).to.be.calledWith(60 * 1000)

        expect(Promise.delay.thirdCall).to.be.calledWith(2 * 60 * 1000)
      })
    })

    it('fails after third retry fails', () => {
      const fn = sinon.stub().rejects(makeError({ message: '500 error', statusCode: 500 }))

      return api.retryWithBackoff(fn)
      .then(() => {
        throw new Error('Should not resolve')
      }).catch((err) => {
        expect(err.message).to.equal('500 error')
      })
    })

    it('calls errors.warning before each retry', () => {
      const err = makeError({ message: '500 error', statusCode: 500 })

      sinon.spy(errors, 'warning')
      const fn = sinon.stub().rejects(err)

      fn.onCall(3).resolves()

      return api.retryWithBackoff(fn).then(() => {
        expect(errors.warning).to.be.calledThrice
        expect(errors.warning.firstCall.args[0]).to.eql('CLOUD_API_RESPONSE_FAILED_RETRYING')
        expect(errors.warning.firstCall.args[1]).to.eql({
          delayMs: 30000,
          tries: 3,
          response: err,
        })

        expect(errors.warning.secondCall.args[1]).to.eql({
          delayMs: 60000,
          tries: 2,
          response: err,
        })

        expect(errors.warning.thirdCall.args[1]).to.eql({
          delayMs: 120000,
          tries: 1,
          response: err,
        })
      })
    })
  })

  context('.updateInstanceArtifacts', () => {
    beforeEach(function () {
      this.artifactOptions = {
        runId: 'run-id-123',
        instanceId: 'instance-id-123',
      }

      this.artifactProps = {
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

    it('PUTs/instances/:id/artifacts', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '1')
      .matchHeader('x-cypress-run-id', this.artifactOptions.runId)
      .matchHeader('x-cypress-request-attempt', '0')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .put('/instances/instance-id-123/artifacts', {
        protocol: this.artifactProps.protocol,
        screenshots: this.artifactProps.screenshots,
        video: this.artifactProps.video,
      })
      .reply(200)

      return api.updateInstanceArtifacts(this.artifactOptions, this.artifactProps)
    })
  })
})
