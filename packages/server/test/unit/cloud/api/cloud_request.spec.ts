import type { Mock, MockInstance } from 'vitest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { agent, strictAgent } from '@packages/network'
import type { CreateAxiosDefaults, AxiosInstance } from 'axios'
import axios from 'axios'
import debugLib from 'debug'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { CloudRequest, createCloudRequest } from '../../../../lib/cloud/api/cloud_request'
import cloudApi from '../../../../lib/cloud/api'
import app_config from '../../../../config/app.json'
import os from 'os'
import pkg from '@packages/root'
import { transformError } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import type { DestroyableProxy } from './utils/fake_proxy_server'
import { fakeServer, fakeProxy, getCA } from './utils/fake_proxy_server'
import dedent from 'dedent'
import { PassThrough } from 'stream'
import fetch from 'cross-fetch'
import nock from 'nock'
import fs from 'fs-extra'

// The logging assertions expect debug's TTY format, and a vitest worker's stderr is never a TTY.
// debug fixes each instance's color mode at creation, so this has to run before the SUT is imported.
await vi.hoisted(async () => {
  const { default: debug } = await import('debug')

  debug.inspectOpts.colors = true
})

describe('CloudRequest', () => {
  afterAll(() => {
    delete debugLib.inspectOpts.colors
  })

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    vi.spyOn(axios, 'create')
  })

  afterEach(() => {
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()
  })

  const getCreatedConfig = (): CreateAxiosDefaults => {
    const [config] = vi.mocked(axios.create).mock.calls[0]

    return config as CreateAxiosDefaults
  }

  it('instantiates with network combined agent', () => {
    createCloudRequest()
    const cfg = getCreatedConfig()

    expect(cfg.httpAgent).toBe(strictAgent)
    expect(cfg.httpsAgent).toBe(strictAgent)
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

    let addNormalAgentRequestSpy: MockInstance<typeof agent['addRequest']>
    let addNormalAgentHttpRequestSpy: MockInstance<typeof agent.httpAgent['addRequest']>
    let addNormalAgentHttpsRequestSpy: MockInstance<typeof agent.httpsAgent['addRequest']>
    let addStrictAgentRequestSpy: MockInstance<typeof strictAgent['addRequest']>
    let addStrictAgentHttpRequestSpy: MockInstance<typeof strictAgent.httpAgent['addRequest']>
    let addStrictAgentHttpsRequestSpy: MockInstance<typeof strictAgent.httpsAgent['addRequest']>
    let currentAgentRequestSpy: typeof addNormalAgentRequestSpy | typeof addStrictAgentRequestSpy
    let currentAgentHttpRequestSpy: typeof addNormalAgentHttpRequestSpy | typeof addStrictAgentHttpRequestSpy
    let currentAgentHttpsRequestSpy: typeof addNormalAgentHttpsRequestSpy | typeof addStrictAgentHttpsRequestSpy

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

      addNormalAgentRequestSpy = vi.spyOn(agent, 'addRequest')
      addNormalAgentHttpRequestSpy = vi.spyOn(agent.httpAgent, 'addRequest')
      addNormalAgentHttpsRequestSpy = vi.spyOn(agent.httpsAgent, 'addRequest')

      addStrictAgentRequestSpy = vi.spyOn(strictAgent, 'addRequest')
      addStrictAgentHttpRequestSpy = vi.spyOn(strictAgent.httpAgent, 'addRequest')
      addStrictAgentHttpsRequestSpy = vi.spyOn(strictAgent.httpsAgent, 'addRequest')

      fakeHttpUpstream = await fakeServer({})
      fakeHttpUpstreamAuth = await fakeServer({ auth: { username: 'upstream', password: 'test' } })
      fakeHttpsUpstream = await fakeServer({ https: true })
      fakeHttpsUpstreamAuth = await fakeServer({ https: true, auth: { username: 'upstream', password: 'test' } })

      fakeHttpProxy = await fakeProxy({})
      fakeHttpProxyAuth = await fakeProxy({ auth: { username: 'Proxy', password: 'test2' } })
      fakeHttpsProxy = await fakeProxy({ https: true })
      fakeHttpsProxyAuth = await fakeProxy({ https: true, auth: { username: 'Proxy', password: 'test2' } })

      strictAgent.httpsAgent.options.ca = [await fs.promises.readFile(getCA().getCACertPath(), 'utf8')]
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
        currentAgentRequestSpy = addStrictAgentRequestSpy
        currentAgentHttpRequestSpy = addStrictAgentHttpRequestSpy
        currentAgentHttpsRequestSpy = addStrictAgentHttpsRequestSpy
        const CloudReq = createCloudRequest({ baseURL: targetServer.baseUrl })

        return CloudReq[method](`/ping`, {}).then((r) => r.data)
      }

      const additional = method === 'post' ? {
        body: {},
        json: true,
      } : {}

      currentAgentRequestSpy = addNormalAgentRequestSpy
      currentAgentHttpRequestSpy = addNormalAgentHttpRequestSpy
      currentAgentHttpsRequestSpy = addNormalAgentHttpsRequestSpy

      return cloudApi.rp[method]({
        url: `${targetServer.baseUrl}/ping`,
        rejectUnauthorized: !targetServer.isHttps && !targetServer.isHttps,
        ...additional,
      })
    }

    it('does a basic request', async () => {
      const CloudReq = createCloudRequest({ baseURL: fakeHttpUpstream.baseUrl })

      expect(await CloudReq.get('/ping').then((r) => r.data)).toEqual('OK')
      expect(fakeHttpUpstream.requests[0].rawHeaders).not.toContain('Proxy-Authorization')
    })

    //
    for (const adapter of ['Axios', 'Request'] as const) {
      it(`${adapter}: issues requests to the correct location when HTTP -> HTTPS via Proxy`, async () => {
        const result = await executeProxyRequest({ adapter, proxyServer: fakeHttpProxy, targetServer: fakeHttpsUpstream })

        expect(result).toEqual('OK')

        expect(fakeHttpProxy.requests.length).toBe(1)
        expect(fakeHttpProxy.requests[0].url).toBe(`localhost:${fakeHttpsUpstream.port}`)
        expect(fakeHttpProxy.requests[0].rawHeaders).toEqual(['Host', `localhost:${fakeHttpsUpstream.port}`])
        expect(fakeHttpProxy.requests[0].method).toEqual('CONNECT')

        expect(currentAgentRequestSpy.mock.calls.length).toBe(1)
        expect(currentAgentHttpRequestSpy.mock.calls.length).toEqual(0)
        expect(currentAgentHttpsRequestSpy.mock.calls.length).toEqual(1)
      })

      it(`${adapter}: issues requests to the correct location when using HTTPS -> HTTPS via Proxy`, async () => {
        const result = await executeProxyRequest({ adapter, proxyServer: fakeHttpsProxy, targetServer: fakeHttpsUpstream })

        expect(result).toEqual('OK')

        expect(fakeHttpsProxy.requests.length).toBe(1)
        expect(fakeHttpsProxy.requests[0].url).toBe(`localhost:${fakeHttpsUpstream.port}`)
        expect(fakeHttpsProxy.requests[0].rawHeaders).toEqual(['Host', `localhost:${fakeHttpsUpstream.port}`])
        expect(fakeHttpsProxy.requests[0].method).toEqual('CONNECT')

        expect(currentAgentRequestSpy.mock.calls.length).toBe(1)
        expect(currentAgentHttpRequestSpy.mock.calls.length).toEqual(0)
        expect(currentAgentHttpsRequestSpy.mock.calls.length).toEqual(1)
      })

      it(`${adapter}: issues requests to the correct location when doing HTTP -> HTTP proxy`, async () => {
        const result = await executeProxyRequest({
          method: 'post',
          targetServer: fakeHttpUpstream,
          proxyServer: fakeHttpProxy,
          adapter,
        })

        expect(result).toEqual({ ok: true })

        expect(fakeHttpProxy.requests.length).toBe(1)
        expect(fakeHttpProxy.requests[0].url).toBe(`http://localhost:${fakeHttpUpstream.port}/ping`)
        if (adapter === 'Request') {
          expect(fakeHttpProxy.requests[0].rawHeaders).toEqual([
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
          expect(fakeHttpProxy.requests[0].rawHeaders).toEqual([
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

        expect(fakeHttpProxy.requests[0].method).toEqual('POST')
        expect(currentAgentRequestSpy.mock.calls.length).toBe(1)
        expect(currentAgentHttpRequestSpy.mock.calls.length).toEqual(1)
        expect(currentAgentHttpsRequestSpy.mock.calls.length).toEqual(0)
      })

      it(`${adapter}: issues requests to the correct location when doing HTTP (auth) -> HTTPS (auth) proxy`, async () => {
        const result = await executeProxyRequest({
          method: 'post',
          proxyServer: fakeHttpProxyAuth,
          targetServer: fakeHttpsUpstreamAuth,
          adapter,
        })

        expect(result).toEqual({
          ok: true,
          auth: UPSTREAM_AUTH,
        })

        expect(fakeHttpProxyAuth.requests.length).toBe(1)
        expect(fakeHttpProxyAuth.requests[0].url).toBe(`localhost:${fakeHttpsUpstreamAuth.port}`)

        expect(lowerHeaders(fakeHttpProxyAuth.requests[0].rawHeaders)).toEqual([
          'host', `localhost:${fakeHttpsUpstreamAuth.port}`,
          'proxy-authorization', PROXY_AUTH,
        ])

        if (adapter === 'Request') {
          expect(fakeHttpsUpstreamAuth.requests[0].rawHeaders).toEqual([
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
          expect(fakeHttpsUpstreamAuth.requests[0].rawHeaders).toEqual([
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
            // different from Request Promise (changed):
            'Host', `localhost:${fakeHttpsUpstreamAuth.port}`,
            'Authorization', UPSTREAM_AUTH,
            'Connection', 'close',
          ])
        }

        expect(fakeHttpProxyAuth.requests[0].method).toEqual('CONNECT')
        expect(fakeHttpsUpstreamAuth.requests[0].method).toEqual('POST')
        expect(currentAgentRequestSpy.mock.calls.length).toBe(1)
        expect(currentAgentHttpRequestSpy.mock.calls.length).toEqual(0)
        expect(currentAgentHttpsRequestSpy.mock.calls.length).toEqual(1)
      })
    }
  })

  describe('createCloudRequest', () => {
    let fakeApp: DestroyableProxy

    beforeAll(async () => {
      fakeApp = await fakeServer({})
    })

    afterAll(() => fakeApp.teardown())

    let wasEnabled: string

    beforeEach(() => {
      wasEnabled = debugLib.disable()
    })

    afterEach(() => {
      debugLib.enable(wasEnabled)

      vi.restoreAllMocks()
    })

    it('can skip installing logging', async () => {
      debugLib.enable('cypress:server:cloud:api')

      const CloudRequest = createCloudRequest({ baseURL: fakeApp.baseUrl })

      const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

      await CloudRequest.get('/ping')
      const debugCalls = logSpy.mock.calls.flatMap((c) => stripAnsi(String(c[0])).trim().replace(/\+(\d+)ms$/, '+?ms'))

      expect(debugCalls).toEqual([
        'cypress:server:cloud:api get /ping +?ms',
        'cypress:server:cloud:api get /ping Success: 200 OK -> \n  cypress:server:cloud:api   Response: \'OK\' +?ms',
      ])

      logSpy.mockClear()

      const CloudRequestNoLogs = createCloudRequest({ baseURL: fakeApp.baseUrl, enableLogging: false })

      await CloudRequestNoLogs.get('/ping')
      expect(logSpy.mock.calls).toEqual([])
    })

    it('can skip installing the error transform', async () => {
      const CloudRequest = createCloudRequest({ baseURL: fakeApp.baseUrl })

      // Installed
      try {
        await CloudRequest.get('/error')
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.isApiError).toEqual(true)
        expect(e.message).toBe(dedent`
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
        expect(e.isApiError).toEqual(undefined)
        expect(e.response.data).toEqual({ ok: false })
      }
    })
  })

  describe('headers', () => {
    const platform = 'sunos'
    const version = '0.0.0'

    let platformStub: MockInstance<typeof os.platform>
    let versionStub: MockInstance<() => string>

    beforeEach(() => {
      platformStub = vi.spyOn(os, 'platform').mockReturnValue(platform)
      versionStub = vi.spyOn(pkg, 'version', 'get').mockReturnValue(version)
    })

    afterEach(() => {
      platformStub.mockRestore()

      versionStub.mockRestore()
    })

    it('sets exepcted platform, version, and user-agent headers', () => {
      createCloudRequest()
      const cfg = getCreatedConfig()

      expect(cfg.headers).toHaveProperty('x-os-name', platform)
      expect(cfg.headers).toHaveProperty('x-cypress-version', version)
      expect(cfg.headers).toHaveProperty('User-Agent', 'cypress/0.0.0')
    })
  })

  describe('interceptors', () => {
    let stubbedAxiosInstance: { interceptors: Record<'request' | 'response', Record<'use' | 'eject' | 'clear', Mock>> }

    beforeEach(() => {
      stubbedAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
            eject: vi.fn(),
            clear: vi.fn(),
          },
          response: {
            use: vi.fn(),
            eject: vi.fn(),
            clear: vi.fn(),
          },
        },
      }

      // Safe because createCloudRequest only touches `interceptors` on the instance
      vi.mocked(axios.create).mockReturnValue(stubbedAxiosInstance as unknown as AxiosInstance)

      createCloudRequest()
    })

    it('registers error transformation interceptor', () => {
      expect(stubbedAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(undefined, transformError)
    })
  })

  describe('https requests', () => {
    it('handles https requests properly', async () => {
      nock.restore()

      // @ts-ignore
      const addRequestSpy = vi.spyOn(strictAgent.httpsAgent, 'addRequest').mockImplementation((req, options) => {
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

      expect(result1.data).toEqual({ ok: true })

      const result2 = await createCloudRequest({ baseURL: 'https://api.cypress.io' }).post('/ping', {})

      expect(result2.data).toEqual({ ok: true })

      const result3 = await fetch('https://cloud.cypress.io/ping', {
        method: 'POST',
        body: '{}',
        // @ts-expect-error - this is supported
        agent: strictAgent,
      })

      expect(await result3.json()).toEqual({ ok: true })

      expect(addRequestSpy).toHaveBeenCalledTimes(3)
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

        expect(cfg.baseURL).toBe(app_config[env ?? 'development']?.api_url)
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

        expect(cfg.baseURL).toBe(app_config[env ?? 'development']?.api_url)
      })
    })
  })
})
