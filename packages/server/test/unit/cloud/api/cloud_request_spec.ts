/* eslint-disable no-console */
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'
import agent from '@packages/network/lib/agent'
import axios, { CreateAxiosDefaults, AxiosInstance } from 'axios'
import debugLib from 'debug'
import stripAnsi from 'strip-ansi'
import { CloudRequest, createCloudRequest } from '../../../../lib/cloud/api/cloud_request'
import cloudApi from '../../../../lib/cloud/api'
import app_config from '../../../../config/app.json'
import os from 'os'
import pkg from '@packages/root'
import { transformError } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import { DestroyableProxy, fakeServer, fakeProxy } from './utils/fake_proxy_server'
import dedent from 'dedent'
import { PassThrough } from 'stream'
import fetch from 'cross-fetch'
import nock from 'nock'

chai.use(sinonChai)

describe('CloudRequest', () => {
  beforeEach(() => {
    sinon.stub(axios, 'create').callThrough()
  })

  afterEach(() => {
    sinon.restore()
  })

  const getCreatedConfig = (): CreateAxiosDefaults => {
    const { firstCall: { args: [config] } } = (axios.create as sinon.SinonStub)

    return config
  }

  it('instantiates with network combined agent', () => {
    createCloudRequest()
    const cfg = getCreatedConfig()

    expect(cfg.httpAgent).to.eq(agent)
    expect(cfg.httpsAgent).to.eq(agent)
  })

  describe('Proxy Requests', () => {
    let prevEnv = {
      HTTP_PROXY: undefined,
      HTTPS_PROXY: undefined,
      CYPRESS_INTERNAL_ENV: undefined,
      NO_PROXY: undefined,
      NODE_TLS_REJECT_UNAUTHORIZED: undefined,
    }

    let fakeHttpUpstream: DestroyableProxy
    let fakeHttpUpstreamAuth: DestroyableProxy
    let fakeHttpsUpstream: DestroyableProxy
    let fakeHttpsUpstreamAuth: DestroyableProxy

    let fakeHttpProxy: DestroyableProxy
    let fakeHttpProxyAuth: DestroyableProxy
    let fakeHttpsProxy: DestroyableProxy
    let fakeHttpsProxyAuth: DestroyableProxy

    let addRequestSpy: sinon.SinonSpy<Parameters<typeof agent['addRequest']>, ReturnType<typeof agent['addRequest']>>
    let addHttpRequestSpy: sinon.SinonSpy<Parameters<typeof agent.httpAgent['addRequest']>, ReturnType<typeof agent.httpAgent['addRequest']>>
    let addHttpsRequestSpy: sinon.SinonSpy<Parameters<typeof agent.httpsAgent['addRequest']>, ReturnType<typeof agent.httpsAgent['addRequest']>>

    const PROXY_AUTH = `Basic ${Buffer.from('Proxy:test2').toString('base64')}`
    const UPSTREAM_AUTH = `Basic ${Buffer.from('upstream:test').toString('base64')}`

    beforeEach(async () => {
      prevEnv.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV
      prevEnv.HTTP_PROXY = process.env.HTTP_PROXY
      prevEnv.HTTPS_PROXY = process.env.HTTPS_PROXY
      prevEnv.NO_PROXY = process.env.NO_PROXY
      prevEnv.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED

      // Delete NO_PROXY env so we can test HTTP -> HTTP proxy
      delete process.env.NO_PROXY
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED

      addRequestSpy = sinon.spy(agent, 'addRequest')
      addHttpRequestSpy = sinon.spy(agent.httpAgent, 'addRequest')
      addHttpsRequestSpy = sinon.spy(agent.httpsAgent, 'addRequest')

      fakeHttpUpstream = await fakeServer({})
      fakeHttpUpstreamAuth = await fakeServer({ auth: { username: 'upstream', password: 'test' } })
      fakeHttpsUpstream = await fakeServer({ https: true })
      fakeHttpsUpstreamAuth = await fakeServer({ https: true, auth: { username: 'upstream', password: 'test' } })

      fakeHttpProxy = await fakeProxy({})
      fakeHttpProxyAuth = await fakeProxy({ auth: { username: 'Proxy', password: 'test2' } })
      fakeHttpsProxy = await fakeProxy({ https: true })
      fakeHttpsProxyAuth = await fakeProxy({ https: true, auth: { username: 'Proxy', password: 'test2' } })
    })

    afterEach(async () => {
      for (const key of Object.keys(prevEnv)) {
        if (prevEnv[key]) {
          process.env[key] = prevEnv[key]
        } else {
          delete process.env[key]
        }
      }

      await Promise.all([
        fakeHttpUpstream.teardown(),
        fakeHttpUpstreamAuth.teardown(),
        fakeHttpsUpstream.teardown(),
        fakeHttpsUpstreamAuth.teardown(),
        fakeHttpProxy.teardown(),
        fakeHttpProxyAuth.teardown(),
        fakeHttpsProxy.teardown(),
        fakeHttpsProxyAuth.teardown(),
      ])
    })

    function lowerHeaders (arr: string[]) {
      return arr.map((v, i) => i % 2 ? v : v.toLowerCase())
    }

    function executeProxyRequest (
      opts: {
        adapter: 'Axios' | 'Request'
        method?: 'get' | 'post'
        proxyServer: DestroyableProxy
        targetServer: DestroyableProxy
      },
    ) {
      const { proxyServer, targetServer, adapter, method = 'get' } = opts

      process.env.HTTP_PROXY = proxyServer.baseUrl
      process.env.HTTPS_PROXY = proxyServer.baseUrl

      if ((adapter === 'Axios' && proxyServer.isHttps) || targetServer.isHttps) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
      }

      if (adapter === 'Axios') {
        const CloudReq = createCloudRequest({ baseURL: targetServer.baseUrl })

        return CloudReq[method](`/ping`, {}).then((r) => r.data)
      }

      const additional = method === 'post' ? {
        body: {},
        json: true,
      } : {}

      return cloudApi.rp[method]({
        url: `${targetServer.baseUrl}/ping`,
        rejectUnauthorized: !targetServer.isHttps && !targetServer.isHttps,
        ...additional,
      })
    }

    it('does a basic request', async () => {
      const CloudReq = createCloudRequest({ baseURL: fakeHttpUpstream.baseUrl })

      expect(await CloudReq.get('/ping').then((r) => r.data)).to.eql('OK')
      expect(fakeHttpUpstream.requests[0].rawHeaders).to.not.contain('Proxy-Authorization')
    })

    it('retains Proxy-Authorization for non-proxied requests', async () => {
      const CloudReq = createCloudRequest({ baseURL: fakeHttpUpstream.baseUrl })

      expect(await CloudReq.get('/ping', {
        headers: {
          'Proxy-Authorization': 'foo',
        },
      }).then((r) => r.data)).to.eql('OK')

      const headers = fakeHttpUpstream.requests[0].rawHeaders

      expect(headers[headers.indexOf('Proxy-Authorization') + 1]).to.eql('foo')
    })

    //
    for (const adapter of ['Axios', 'Request'] as const) {
      it(`${adapter}: issues requests to the correct location when HTTP -> HTTPS via Proxy`, async () => {
        const result = await executeProxyRequest({ adapter, proxyServer: fakeHttpProxy, targetServer: fakeHttpsUpstream })

        expect(result).to.eql('OK')

        expect(fakeHttpProxy.requests.length).to.eq(1)
        expect(fakeHttpProxy.requests[0].url).to.eq(`localhost:${fakeHttpsUpstream.port}`)
        expect(fakeHttpProxy.requests[0].rawHeaders).to.eql(['Host', `localhost:${fakeHttpsUpstream.port}`])
        expect(fakeHttpProxy.requests[0].method).to.eql('CONNECT')

        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(0)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(1)
      })

      it(`${adapter}: issues requests to the correct location when using HTTPS -> HTTPS via Proxy`, async () => {
        const result = await await executeProxyRequest({ adapter, proxyServer: fakeHttpsProxy, targetServer: fakeHttpsUpstream })

        expect(result).to.eql('OK')

        expect(fakeHttpsProxy.requests.length).to.eq(1)
        expect(fakeHttpsProxy.requests[0].url).to.eq(`localhost:${fakeHttpsUpstream.port}`)
        expect(fakeHttpsProxy.requests[0].rawHeaders).to.eql(['Host', `localhost:${fakeHttpsUpstream.port}`])
        expect(fakeHttpsProxy.requests[0].method).to.eql('CONNECT')

        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(0)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(1)
      })

      it(`${adapter}: issues requests to the correct location when doing HTTP -> HTTP proxy`, async () => {
        const result = await executeProxyRequest({
          method: 'post',
          targetServer: fakeHttpUpstream,
          proxyServer: fakeHttpProxy,
          adapter,
        })

        expect(result).to.eql({ ok: true })

        expect(fakeHttpProxy.requests.length).to.eq(1)
        expect(fakeHttpProxy.requests[0].url).to.eq(`http://localhost:${fakeHttpUpstream.port}/ping`)
        if (adapter === 'Request') {
          expect(fakeHttpProxy.requests[0].rawHeaders).to.eql([
            'x-os-name', os.platform(),
            'x-cypress-version', pkg.version,
            'host', `localhost:${fakeHttpUpstream.port}`,
            'accept-encoding', 'gzip, deflate',
            'accept', 'application/json',
            'content-type', 'application/json',
            'content-length', '2',
            'Connection', 'close',
          ])
        } else {
          expect(fakeHttpProxy.requests[0].rawHeaders).to.eql([
            // different from Request Promise (changed):
            'Accept', 'application/json, text/plain, */*',
            'Content-Type', 'application/json',
            'x-os-name', os.platform(),
            'x-cypress-version', pkg.version,
            // different from Request Promise (added):
            'User-Agent', `cypress/${pkg.version}`,
            'Content-Length', '2',
            // different from Request Promise (changed):
            // 'Accept-Encoding', 'gzip, deflate',
            'Accept-Encoding', 'gzip, compress, deflate, br',
            'host', `localhost:${fakeHttpUpstream.port}`,
            'Connection', 'close',
          ])
        }

        expect(fakeHttpProxy.requests[0].method).to.eql('POST')
        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(1)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(0)
      })

      it(`${adapter}: issues requests to the correct location when doing HTTP (auth) -> HTTPS (auth) proxy`, async () => {
        const result = await executeProxyRequest({
          method: 'post',
          proxyServer: fakeHttpProxyAuth,
          targetServer: fakeHttpsUpstreamAuth,
          adapter,
        })

        expect(result).to.eql({
          ok: true,
          auth: UPSTREAM_AUTH,
        })

        expect(fakeHttpProxyAuth.requests.length).to.eq(1)
        expect(fakeHttpProxyAuth.requests[0].url).to.eq(`localhost:${fakeHttpsUpstreamAuth.port}`)

        expect(lowerHeaders(fakeHttpProxyAuth.requests[0].rawHeaders)).to.eql([
          'host', `localhost:${fakeHttpsUpstreamAuth.port}`,
          'proxy-authorization', PROXY_AUTH,
        ])

        if (adapter === 'Request') {
          expect(fakeHttpsUpstreamAuth.requests[0].rawHeaders).to.eql([
            'x-os-name', os.platform(),
            'x-cypress-version', pkg.version,
            'host', `localhost:${fakeHttpsUpstreamAuth.port}`,
            'accept-encoding', 'gzip, deflate',
            'authorization', UPSTREAM_AUTH,
            'accept', 'application/json',
            'content-type', 'application/json',
            'content-length', '2',
            'Connection', 'close',
          ])
        } else {
          expect(fakeHttpsUpstreamAuth.requests[0].rawHeaders).to.eql([
            // different from Request Promise (changed):
            'Accept', 'application/json, text/plain, */*',
            'Content-Type', 'application/json',
            'x-os-name', os.platform(),
            'x-cypress-version', pkg.version,
            // different from Request Promise (added):
            'User-Agent', `cypress/${pkg.version}`,
            'Content-Length', '2',
            // different from Request Promise (changed):
            // 'Accept-Encoding', 'gzip, deflate',
            'Accept-Encoding', 'gzip, compress, deflate, br',
            'host', `localhost:${fakeHttpsUpstreamAuth.port}`,
            'Authorization', UPSTREAM_AUTH,
            'Connection', 'close',
          ])
        }

        expect(fakeHttpProxyAuth.requests[0].method).to.eql('CONNECT')
        expect(fakeHttpsUpstreamAuth.requests[0].method).to.eql('POST')
        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(0)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(1)
      })
    }
  })

  describe('createCloudRequest', () => {
    let fakeApp: DestroyableProxy

    before(async () => {
      fakeApp = await fakeServer({})
    })

    after(() => fakeApp.teardown())

    let wasEnabled: string

    beforeEach(() => {
      wasEnabled = debugLib.disable()
    })

    afterEach(() => {
      debugLib.enable(wasEnabled)

      sinon.restore()
    })

    it('can skip installing logging', async () => {
      debugLib.enable('cypress:server:cloud:api')

      const CloudRequest = createCloudRequest({ baseURL: fakeApp.baseUrl })

      const logSpy = sinon.stub(process.stderr, 'write')

      await CloudRequest.get('/ping')
      const debugCalls = logSpy.getCalls().flatMap((c) => stripAnsi(String(c.args[0])).trim().replace(/\+(\d+)ms$/, '+?ms'))

      expect(debugCalls).to.eql([
        'cypress:server:cloud:api get /ping +?ms',
        'cypress:server:cloud:api get /ping Success: 200 OK -> \n  cypress:server:cloud:api   Response: \'OK\' +?ms',
      ])

      logSpy.reset()

      const CloudRequestNoLogs = createCloudRequest({ baseURL: fakeApp.baseUrl, enableLogging: false })

      await CloudRequestNoLogs.get('/ping')
      expect(logSpy.getCalls()).to.eql([])
    })

    it('can skip installing the error transform', async () => {
      const CloudRequest = createCloudRequest({ baseURL: fakeApp.baseUrl })

      // Installed
      try {
        await CloudRequest.get('/error')
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.isApiError).to.eql(true)
        expect(e.message).to.equal(dedent`
        404
        
        {
          "ok": false
        }
        `)
      }

      const CloudRequestNoError = createCloudRequest({ baseURL: fakeApp.baseUrl, enableErrorTransform: false })

      // Not Installed
      try {
        await CloudRequestNoError.get('/error')
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.isApiError).to.eql(undefined)
        expect(e.response.data).to.eql({ ok: false })
      }
    })
  })

  describe('headers', () => {
    const platform = 'sunos'
    const version = '0.0.0'

    let versionStub

    beforeEach(() => {
      sinon.stub(os, 'platform').returns(platform)
      versionStub = sinon.stub(pkg, 'version').get(() => version)
    })

    afterEach(() => {
      (os.platform as sinon.SinonStub).restore()

      versionStub.restore()
    })

    it('sets exepcted platform, version, and user-agent headers', () => {
      createCloudRequest()
      const cfg = getCreatedConfig()

      expect(cfg.headers).to.have.property('x-os-name', platform)
      expect(cfg.headers).to.have.property('x-cypress-version', version)
      expect(cfg.headers).to.have.property('User-Agent', 'cypress/0.0.0')
    })
  })

  describe('interceptors', () => {
    let stubbedAxiosInstance: Partial<sinon.SinonStubbedInstance<AxiosInstance>>

    beforeEach(() => {
      stubbedAxiosInstance = {
        interceptors: {
          request: {
            use: sinon.stub(),
            eject: sinon.stub(),
            clear: sinon.stub(),
          },
          response: {
            use: sinon.stub(),
            eject: sinon.stub(),
            clear: sinon.stub(),
          },
        },
      }

      ;(axios.create as sinon.SinonStub).returns(stubbedAxiosInstance)

      createCloudRequest()
    })

    it('registers error transformation interceptor', () => {
      expect(stubbedAxiosInstance.interceptors?.response.use).to.have.been.calledWith(undefined, transformError)
    })
  })

  describe('https requests', () => {
    it('handles https requests properly', async () => {
      nock.restore()

      // @ts-ignore
      const addRequestSpy = sinon.stub(agent.httpsAgent, 'addRequest').callsFake((req, options) => {
        // fake IncomingMessage
        const res = new PassThrough() as any

        res.statusCode = 200
        res.headers = {
          'content-type': 'application/json',
        }

        process.nextTick(() => {
          req.emit('response', res)
          res.write(JSON.stringify({ ok: options.port === 443 && options.protocol === 'https:' }))
          res.end()
        })
      })

      const result1 = await CloudRequest.post('https://cloud.cypress.io/ping', {})

      expect(result1.data).to.eql({ ok: true })

      const result2 = await createCloudRequest({ baseURL: 'https://api.cypress.io' }).post('/ping', {})

      expect(result2.data).to.eql({ ok: true })

      const result3 = await fetch('https://cloud.cypress.io/ping', {
        method: 'POST',
        body: '{}',
        // @ts-expect-error - this is supported
        agent,
      })

      expect(await result3.json()).to.eql({ ok: true })

      expect(addRequestSpy).to.have.been.calledThrice
    })
  })

  ;[undefined, 'development', 'test', 'staging', 'production'].forEach((env) => {
    describe(`base url for CYPRESS_CONFIG_ENV "${env}"`, () => {
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_CONFIG_ENV
        if (env) {
          process.env.CYPRESS_CONFIG_ENV = env
        } else {
          delete process.env.CYPRESS_CONFIG_ENV
        }
      })

      afterEach(() => {
        if (prevEnv) {
          process.env.CYPRESS_CONFIG_ENV = prevEnv
        } else {
          delete process.env.CYPRESS_CONFIG_ENV
        }
      })

      it('sets to the value defined in app config', () => {
        createCloudRequest()
        const cfg = getCreatedConfig()

        expect(cfg.baseURL).to.eq(app_config[env ?? 'development']?.api_url)
      })
    })

    describe(`base url for CYPRESS_INTERNAL_ENV "${env}"`, () => {
      let prevEnv

      beforeEach(() => {
        prevEnv = process.env.CYPRESS_INTERNAL_ENV
        if (env) {
          process.env.CYPRESS_INTERNAL_ENV = env
        } else {
          delete process.env.CYPRESS_INTERNAL_ENV
        }
      })

      afterEach(() => {
        if (prevEnv) {
          process.env.CYPRESS_INTERNAL_ENV = prevEnv
        } else {
          delete process.env.CYPRESS_INTERNAL_ENV
        }
      })

      it('sets to the value defined in app config', () => {
        createCloudRequest()
        const cfg = getCreatedConfig()

        expect(cfg.baseURL).to.eq(app_config[env ?? 'development']?.api_url)
      })
    })
  })
})
