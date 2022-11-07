require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const {
  agent,
} = require('@packages/network')
const pkg = require('@packages/root')
const api = require('../../../lib/cloud/api')
const cache = require('../../../lib/cache')
const errors = require('../../../lib/errors')
const machineId = require('../../../lib/cloud/machine_id')
const Promise = require('bluebird')

const API_BASEURL = 'http://localhost:1234'
const DASHBOARD_BASEURL = 'http://localhost:3000'
const AUTH_URLS = {
  'dashboardAuthUrl': 'http://localhost:3000/test-runner.html',
  'dashboardLogoutUrl': 'http://localhost:3000/logout',
}

const makeError = (details = {}) => {
  return _.extend(new Error(details.message || 'Some error'), details)
}

describe('lib/cloud/api', () => {
  beforeEach(() => {
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

  context('.createRun', () => {
    beforeEach(function () {
      this.buildProps = {
        group: null,
        parallel: null,
        ciBuildId: null,
        projectId: 'id-123',
        recordKey: 'token-123',
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
          'dynamicSpecsInSerialMode': true,
          'skipSpecAction': true,
        },
      }
    })

    it('POST /runs + returns runId', function () {
      nock(API_BASEURL)
      .matchHeader('x-route-version', '4')
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .post('/runs', this.buildProps)
      .reply(200, {
        runId: 'new-run-id-123',
      })

      return api.createRun(this.buildProps)
      .then((ret) => {
        expect(ret).to.deep.eq({ runId: 'new-run-id-123' })
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

      return api.createRun(this.buildProps)
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

      return api.createRun({})
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

      return api.createRun(this.buildProps)
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
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
      nock(DASHBOARD_BASEURL)
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
      nock(DASHBOARD_BASEURL)
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

  context('.createProject', () => {
    beforeEach(function () {
      this.postProps = {
        name: 'foobar',
        orgId: 'org-id-123',
        public: true,
        remoteOrigin: 'remoteOrigin',
      }

      this.createProps = {
        projectName: 'foobar',
        orgId: 'org-id-123',
        public: true,
      }
    })

    it('POST /projects', function () {
      nock(API_BASEURL)
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-route-version', '2')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/projects', this.postProps)
      .reply(200, {
        id: 'id-123',
        name: 'foobar',
        orgId: 'org-id-123',
        public: true,
      })

      return api.createProject(this.createProps, 'remoteOrigin', 'auth-token-123')
      .then((projectDetails) => {
        expect(projectDetails).to.deep.eq({
          id: 'id-123',
          name: 'foobar',
          orgId: 'org-id-123',
          public: true,
        })
      })
    })

    it('POST /projects failure formatting', () => {
      nock(API_BASEURL)
      .matchHeader('x-os-name', 'linux')
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-route-version', '2')
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/projects', {
        name: 'foobar',
        orgId: 'org-id-123',
        public: true,
        remoteOrigin: 'remoteOrigin',
      })
      .reply(422, {
        errors: {
          orgId: ['is required'],
        },
      })

      const projectDetails = {
        projectName: 'foobar',
        orgId: 'org-id-123',
        public: true,
      }

      return api.createProject(projectDetails, 'remoteOrigin', 'auth-token-123')
      .then(() => {
        throw new Error('should have thrown here')
      }).catch((err) => {
        expect(err.message).to.eq(`\
422

{
  "errors": {
    "orgId": [
      "is required"
    ]
  }
}\
`)
      })
    })

    it('tags errors', function () {
      nock(API_BASEURL)
      .matchHeader('authorization', 'Bearer auth-token-123')
      .matchHeader('accept-encoding', /gzip/)
      .post('/projects', this.postProps)
      .reply(500, {})

      return api.createProject(this.createProps, 'remoteOrigin', 'auth-token-123')
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
      }).catch((err) => {
        expect(err.message).to.equal('499 error')

        return api.retryWithBackoff(fn2)
      }).then(() => {
        throw new Error('Should not resolve 600 error')
      }).catch((err) => {
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
        expect(errors.warning.firstCall.args[0]).to.eql('DASHBOARD_API_RESPONSE_FAILED_RETRYING')
        expect(errors.warning.firstCall.args[1]).to.eql({
          delay: 30000,
          tries: 3,
          response: err,
        })

        expect(errors.warning.secondCall.args[1]).to.eql({
          delay: 60000,
          tries: 2,
          response: err,
        })

        expect(errors.warning.thirdCall.args[1]).to.eql({
          delay: 120000,
          tries: 1,
          response: err,
        })
      })
    })
  })
})
