/* eslint-disable no-console */
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'
import agent from '@packages/network/lib/agent'
import axios, { CreateAxiosDefaults, AxiosInstance } from 'axios'
import { _create } from '../../../../lib/cloud/api/cloud_request'
import cloudApi from '../../../../lib/cloud/api'
import app_config from '../../../../config/app.json'
import os from 'os'
import pkg from '@packages/root'
import { transformError } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import { fakeHttpServer, fakeHttpsServer, fakeProxyServer } from './utils/fake_proxy_server'

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
    _create()
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

    let fakeHttpServerResult: Awaited<ReturnType<typeof fakeHttpServer>>
    let fakeHttpsServerResult: Awaited<ReturnType<typeof fakeHttpsServer>>
    let fakeHttpsConnectServerResult: Awaited<ReturnType<typeof fakeHttpsServer>>
    let fakeProxyServerResult: Awaited<ReturnType<typeof fakeProxyServer>>
    let fakeProxyServerAuthResult: Awaited<ReturnType<typeof fakeProxyServer>>
    let addRequestSpy: sinon.SinonSpy<Parameters<typeof agent['addRequest']>, ReturnType<typeof agent['addRequest']>>
    let addHttpRequestSpy: sinon.SinonSpy<Parameters<typeof agent.httpAgent['addRequest']>, ReturnType<typeof agent.httpAgent['addRequest']>>
    let addHttpsRequestSpy: sinon.SinonSpy<Parameters<typeof agent.httpsAgent['addRequest']>, ReturnType<typeof agent.httpsAgent['addRequest']>>

    beforeEach(async () => {
      prevEnv.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV
      prevEnv.HTTP_PROXY = process.env.HTTP_PROXY
      prevEnv.HTTPS_PROXY = process.env.HTTPS_PROXY
      prevEnv.NO_PROXY = process.env.NO_PROXY
      prevEnv.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED

      // Delete NO_PROXY env so we can test HTTP -> HTTP proxy
      delete process.env.NO_PROXY

      addRequestSpy = sinon.spy(agent, 'addRequest')
      addHttpRequestSpy = sinon.spy(agent.httpAgent, 'addRequest')
      addHttpsRequestSpy = sinon.spy(agent.httpsAgent, 'addRequest')

      fakeHttpServerResult = await fakeHttpServer()
      fakeHttpsServerResult = await fakeHttpsServer()
      fakeHttpsConnectServerResult = await fakeHttpsServer()
      fakeProxyServerResult = await fakeProxyServer()
      fakeProxyServerAuthResult = await fakeProxyServer({ auth: { username: 'foo', password: 'bar' } })
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
        fakeHttpServerResult.teardown(),
        fakeHttpsServerResult.teardown(),
        fakeHttpsConnectServerResult.teardown(),
        fakeProxyServerResult.teardown(),
        fakeProxyServerAuthResult.teardown(),
      ])
    })

    function pingHttps (adapter: 'Axios' | 'Request') {
      if (adapter === 'Axios') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

        const CloudReq = _create({ baseURL: `https://localhost:${fakeHttpsServerResult.port}` })

        return CloudReq.get(`/ping`, {}).then((r) => r.data)
      }

      return cloudApi.rp.get({
        url: `https://localhost:${fakeHttpsServerResult.port}/ping`,
        rejectUnauthorized: false,
      })
    }

    for (const adapter of ['Axios', 'Request'] as const) {
      it(`${adapter}: issues requests to the correct location when HTTP -> HTTPS via Proxy`, async () => {
        process.env.HTTP_PROXY = `http://localhost:${fakeProxyServerResult.port}`
        process.env.HTTPS_PROXY = `http://localhost:${fakeProxyServerResult.port}`

        const result = await pingHttps(adapter)

        expect(result).to.eql('OK')

        expect(fakeProxyServerResult.requests.length).to.eq(1)
        expect(fakeProxyServerResult.requests[0].url).to.eq(`localhost:${fakeHttpsServerResult.port}`)
        expect(fakeProxyServerResult.requests[0].rawHeaders).to.eql(['Host', `localhost:${fakeHttpsServerResult.port}`])
        expect(fakeProxyServerResult.requests[0].method).to.eql('CONNECT')

        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(0)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(1)
      })

      it(`${adapter}: issues requests to the correct location when using HTTPS -> HTTPS via Proxy`, async () => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        process.env.HTTP_PROXY = `https://localhost:${fakeHttpsConnectServerResult.port}`
        process.env.HTTPS_PROXY = `https://localhost:${fakeHttpsConnectServerResult.port}`

        const result = await pingHttps(adapter)

        expect(result).to.eql('OK')

        expect(fakeHttpsConnectServerResult.requests.length).to.eq(1)
        expect(fakeHttpsConnectServerResult.requests[0].url).to.eq(`localhost:${fakeHttpsServerResult.port}`)
        expect(fakeHttpsConnectServerResult.requests[0].rawHeaders).to.eql(['Host', `localhost:${fakeHttpsServerResult.port}`])
        expect(fakeHttpsConnectServerResult.requests[0].method).to.eql('CONNECT')

        expect(addRequestSpy.getCalls().length).to.eq(1)
        expect(addHttpRequestSpy.getCalls().length).to.eql(0)
        expect(addHttpsRequestSpy.getCalls().length).to.eql(1)
      })
    }

    it('RP: issues requests to the correct location when doing HTTP -> HTTP proxy', async () => {
      process.env.HTTP_PROXY = `http://foo:bar@localhost:${fakeProxyServerAuthResult.port}`
      process.env.HTTPS_PROXY = `http://foo:bar@localhost:${fakeProxyServerAuthResult.port}`

      const result = await cloudApi.rp.post({
        url: `http://localhost:${fakeHttpServerResult.port}/ping`,
        json: true,
        body: {
        },
      })

      expect(result).to.eql({ ok: true })

      expect(fakeProxyServerAuthResult.requests.length).to.eq(1)
      expect(fakeProxyServerAuthResult.requests[0].url).to.eq(`http://localhost:${fakeHttpServerResult.port}/ping`)
      expect(fakeProxyServerAuthResult.requests[0].rawHeaders).to.eql([
        'x-os-name', os.platform(),
        'x-cypress-version', pkg.version,
        'host', `localhost:${fakeHttpServerResult.port}`,
        'accept-encoding', 'gzip, deflate',
        'accept', 'application/json',
        'content-type', 'application/json',
        'content-length', '2',
        'proxy-authorization', 'basic Zm9vOmJhcg==',
        'Connection', 'close',
      ])

      expect(fakeProxyServerAuthResult.requests[0].method).to.eql('POST')
      expect(addRequestSpy.getCalls().length).to.eq(1)
      expect(addHttpRequestSpy.getCalls().length).to.eql(1)
      expect(addHttpsRequestSpy.getCalls().length).to.eql(0)
    })

    it('Axios: issues requests to the correct location when using HTTP -> HTTP proxy', async () => {
      process.env.HTTP_PROXY = `http://foo:bar@localhost:${fakeProxyServerAuthResult.port}`
      process.env.HTTPS_PROXY = `http://foo:bar@localhost:${fakeProxyServerAuthResult.port}`

      const CloudReq = _create({ baseURL: `http://localhost:${fakeHttpServerResult.port}` })

      const result = await CloudReq.post('/ping', {})

      expect(result.data).to.eql({ ok: true })

      expect(fakeProxyServerAuthResult.requests.length).to.eq(1)
      expect(fakeProxyServerAuthResult.requests[0].url).to.eq(`http://localhost:${fakeHttpServerResult.port}/ping`)
      expect(fakeProxyServerAuthResult.requests[0].rawHeaders).to.eql([
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
        'proxy-authorization', 'basic Zm9vOmJhcg==',
        'host', `localhost:${fakeHttpServerResult.port}`,
        'Connection', 'close',
      ])

      expect(fakeProxyServerAuthResult.requests[0].method).to.eql('POST')
      expect(addRequestSpy.getCalls().length).to.eq(1)
      expect(addHttpRequestSpy.getCalls().length).to.eql(1)
      expect(addHttpsRequestSpy.getCalls().length).to.eql(0)
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
      _create()
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

      _create()
    })

    it('registers error transformation interceptor', () => {
      expect(stubbedAxiosInstance.interceptors?.response.use).to.have.been.calledWith(undefined, transformError)
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
        _create()
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
        _create()
        const cfg = getCreatedConfig()

        expect(cfg.baseURL).to.eq(app_config[env ?? 'development']?.api_url)
      })
    })
  })
})
