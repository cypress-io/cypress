import { NetworkProxy } from '@packages/proxy'
import { NetworkInterceptionCore } from '@packages/network-interception'
import type { Protocol } from 'devtools-protocol'
import { createCdpFetchRuntime, createProxyRuntime } from '../../lib/network-runtime'
import '../spec_helper'

describe('lib/network-runtime', () => {
  const baseDeps = () => ({
    config: {
      clientRoute: '/__/',
      responseTimeout: 30000,
    } as Cypress.Config,
    remoteStates: {
      hasPrimary: sinon.stub().returns(false),
      getPrimary: sinon.stub().returns({ origin: 'https://example.test', strategy: 'http', props: {} }),
      get: sinon.stub().returns(undefined),
      current: sinon.stub().returns({ origin: 'https://example.test', strategy: 'http', props: {} }),
      isPrimarySuperDomainBasedOrigin: sinon.stub().returns(false),
      isPrimarySuperDomainOrigin: sinon.stub().returns(false),
      getByStrategy: sinon.stub(),
      reset: sinon.stub(),
    } as any,
    getFileServerToken: () => 'token',
    getCookieJar: () => ({
      getCookies: sinon.stub().returns([]),
    }) as any,
    socket: {
      toDriver: sinon.stub(),
    } as any,
    request: {
      rp: sinon.stub(),
    } as any,
    serverBus: { emit: sinon.stub() } as any,
    getCurrentBrowser: () => ({}) as any,
  })

  function createPausedRequest (options: {
    requestId: string
    networkId?: string
    url?: string
    resourceType?: Protocol.Network.ResourceType
    responseStatusCode?: number
  }): Protocol.Fetch.RequestPausedEvent {
    return {
      requestId: options.requestId,
      networkId: options.networkId,
      frameId: 'frame-1',
      resourceType: options.resourceType ?? 'Document',
      request: {
        url: options.url ?? 'https://example.test/',
        method: 'GET',
        headers: {},
      },
      responseStatusCode: options.responseStatusCode,
    } as Protocol.Fetch.RequestPausedEvent
  }

  async function startCdpRuntime (runtime: ReturnType<typeof createCdpFetchRuntime>, client: { send: sinon.SinonStub, on: sinon.SinonStub }) {
    await runtime.start()
    client.send.resetHistory()

    return (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => {
      return Promise.all(client.on.withArgs('Fetch.requestPaused').getCalls().map((call) => {
        const handler = call.args[1] as (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => void

        return handler(event, sessionId)
      }))
    }
  }

  async function tick () {
    await Promise.resolve()
  }

  async function flush () {
    // Legacy middleware runs several async Bluebird stages before the transport
    // continues the CDP request; flush a handful of microtasks/macrotasks.
    for (let i = 0; i < 10; i++) {
      await tick()
    }

    await new Promise((resolve) => setImmediate(resolve))
  }

  it('createProxyRuntime constructs networkProxy and netStubbingState', () => {
    const runtime = createProxyRuntime(baseDeps())

    expect(runtime.networkProxy).to.be.instanceOf(NetworkProxy)
    expect(runtime.netStubbingState.routes).to.deep.equal([])
    expect(runtime.netStubbingState.requests).to.deep.equal({})
  })

  it('registers default configurator network policies at startup', () => {
    const runtime = createProxyRuntime({
      ...baseDeps(),
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        blockHosts: ['localhost:3131'],
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies).to.have.length(3)
    expect(policies[0].name).to.eq('blocked-hosts')
    expect(policies[0].when({ url: 'http://localhost:3131/' })).to.be.true
    expect(runtime.networkInterceptionCore).to.be.instanceOf(NetworkInterceptionCore)
    expect(runtime.networkInterceptionCore.requestInterception).to.exist
    expect(runtime.networkInterceptionCore.responseInterception).to.exist
    expect(runtime.networkInterceptionCore.documentPreparation).to.exist
    expect(runtime.networkInterceptionCore.networkCapture).to.exist
    expect(runtime.networkInterceptionCore.cookieState).to.exist
    expect(runtime.networkInterceptionCore.commandLog).to.exist
  })

  it('registers configurator CSP and document rewrite policies at startup', () => {
    const runtime = createProxyRuntime({
      ...baseDeps(),
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        experimentalCspAllowList: ['script-src'],
        modifyObstructiveCode: true,
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies.map((p) => p.name)).to.include.members([
      'blocked-hosts',
      'csp-allow-list',
      'document-rewrite',
    ])
  })

  it('handleHttpRequest delegates to networkProxy.handleHttpRequest', async () => {
    const runtime = createProxyRuntime(baseDeps())
    const req = { proxiedUrl: 'http://example.com/' }
    const res = {}
    const stub = sinon.stub(runtime.networkProxy, 'handleHttpRequest').resolves()

    await runtime.handleHttpRequest(req, res)

    expect(stub).to.have.been.calledOnceWith(req, res)
  })

  it('setProtocolManager delegates to networkProxy', () => {
    const runtime = createProxyRuntime(baseDeps())
    const spy = sinon.spy(runtime.networkProxy, 'setProtocolManager')
    const pm = {} as any

    runtime.setProtocolManager(pm)

    expect(spy).to.have.been.calledOnceWith(pm)
  })

  it('reset and clearCredentials delegate to networkProxy', () => {
    const runtime = createProxyRuntime(baseDeps())
    const resetSpy = sinon.spy(runtime.networkProxy, 'reset')
    const clearSpy = sinon.spy(runtime.networkProxy, 'clearCredentials')

    runtime.reset({ resetBetweenSpecs: true })
    runtime.clearCredentials()

    expect(resetSpy).to.have.been.calledOnceWith({ resetBetweenSpecs: true })
    expect(clearSpy).to.have.been.calledOnce
  })

  it('addBrowserPreRequest delegates to networkProxy.addPendingBrowserPreRequest', async () => {
    const runtime = createProxyRuntime(baseDeps())
    const spy = sinon.spy(runtime.networkProxy, 'addPendingBrowserPreRequest')
    const preRequest = { requestId: '1', url: 'http://example.com' } as any

    await runtime.addBrowserPreRequest(preRequest)

    expect(spy).to.have.been.calledOnceWith(preRequest)
  })

  it('createCdpFetchRuntime wires CDP Fetch with the legacy proxy pipeline', () => {
    const client = {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const isAUTFrame = sinon.stub().resolves(true)
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      isAUTFrame,
    })

    expect(runtime.networkProxy).to.be.instanceOf(NetworkProxy)
    expect(runtime.netStubbingState.routes).to.deep.equal([])
    expect(runtime.networkInterception).to.exist
    expect(runtime.networkInterceptionCore).to.be.instanceOf(NetworkInterceptionCore)
    expect(runtime.networkPolicyRegistration).to.exist
    expect(runtime.fetchTransport).to.exist
    // Express handleHttpRequest uses a proxy-codec intercept; CDP traffic uses a distinct one.
    expect(runtime.networkProxy.http.networkInterception).to.exist
    expect(runtime.networkProxy.http.networkInterception).to.not.equal(runtime.networkInterception)

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies.map((p) => p.name)).to.include.members([
      'blocked-hosts',
      'csp-allow-list',
      'document-rewrite',
    ])
  })

  it('createCdpFetchRuntime routes handleHttpRequest through the Express intercept', async () => {
    const client = {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
    })
    const expressIntercept = runtime.networkProxy.http.networkInterception!
    const handleStub = sinon.stub(expressIntercept, 'handle').resolves({} as any)
    const req = { proxiedUrl: 'http://example.com/', get: sinon.stub() } as any
    const res = {} as any

    await runtime.networkProxy.handleHttpRequest(req, res)

    expect(handleStub).to.have.been.calledOnce
    expect(handleStub.firstCall.args[0]).to.include({ req, res })
  })

  it('createCdpFetchRuntime reuses a provided netStubbingState', () => {
    const client = {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const existingState = {
      routes: [{ id: 'existing-route' }],
      requests: {},
      reset: sinon.stub(),
    } as any
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      netStubbingState: existingState,
    })

    expect(runtime.netStubbingState).to.equal(existingState)
    expect(runtime.networkProxy.http.netStubbingState).to.equal(existingState)
  })

  it('createCdpFetchRuntime registers blocked-hosts policy for the CDP path', () => {
    const client = {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        blockHosts: ['blocked.example.test'],
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()
    const blockedHosts = policies.find((p) => p.name === 'blocked-hosts')

    expect(blockedHosts).to.exist
    expect(blockedHosts!.when({ url: 'http://blocked.example.test/' })).to.be.true
    expect(blockedHosts!.when({ url: 'http://allowed.example.test/' })).to.be.false
  })

  it('createCdpFetchRuntime reset clears transport state without resetting NetworkProxy or disabling Fetch', async () => {
    const client = {
      send: sinon.stub().resolves({}),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const networkProxyReset = sinon.spy(runtime.networkProxy, 'reset')
    const transportReset = sinon.spy(runtime.fetchTransport, 'reset')

    await runtime.start()
    client.send.resetHistory()

    runtime.reset()

    // server-base owns networkProxy.reset; runtime.reset is transport-only
    expect(networkProxyReset).not.to.have.been.called
    expect(transportReset).to.have.been.calledOnce
    expect(client.send).not.to.have.been.calledWith('Fetch.disable')

    await runtime.stop()

    expect(client.send).to.have.been.calledWith('Fetch.disable')
  })

  it('createCdpFetchRuntime records the AUT URL when the automation layer reports an AUT navigation commit', async () => {
    const client = {
      send: sinon.stub().resolves({}),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    let notifyAUTFrameNavigated!: (url: string) => void
    const unsubscribe = sinon.stub()
    const onAUTFrameNavigated = sinon.stub().callsFake((listener: (url: string) => void) => {
      notifyAUTFrameNavigated = listener

      return unsubscribe
    })
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      onAUTFrameNavigated,
    })

    await runtime.start()

    const setAUTUrl = sinon.spy(runtime.networkProxy.http, 'setAUTUrl')

    // test isolation blanks the AUT frame between tests; about:blank must
    // never become the simulated top
    notifyAUTFrameNavigated('about:blank')
    notifyAUTFrameNavigated('data:text/html,<p>hi</p>')
    notifyAUTFrameNavigated('https://app.test/dashboard')

    expect(setAUTUrl).to.have.been.calledOnceWith('https://app.test/dashboard')

    await runtime.stop()

    expect(unsubscribe).to.have.been.calledOnce
  })

  it('createCdpFetchRuntime unsubscribes from AUT navigation commits when Fetch.enable fails', async () => {
    const client = {
      send: sinon.stub().rejects(new Error('enable failed')),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const unsubscribe = sinon.stub()
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      onAUTFrameNavigated: sinon.stub().returns(unsubscribe),
    })

    await expect(runtime.start()).to.be.rejectedWith('enable failed')

    expect(unsubscribe).to.have.been.calledOnce
  })

  it('createCdpFetchRuntime starts Fetch interception and continues requests by default', async () => {
    const client = {
      send: sinon.stub().callsFake(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    const handled = onRequestPaused(createPausedRequest({
      requestId: 'fetch-request',
      networkId: 'network-1',
    }))

    await flush()

    // Legacy request middleware may mutate headers (e.g. accept-encoding) before continue.
    const continueCall = client.send.getCalls().find((call) => call.args[0] === 'Fetch.continueRequest')

    expect(continueCall, 'expected Fetch.continueRequest').to.exist
    expect(continueCall!.args[1]).to.include({ requestId: 'fetch-request' })

    await onRequestPaused(createPausedRequest({
      requestId: 'fetch-request',
      networkId: 'network-1',
      responseStatusCode: 200,
    }))

    await flush()
    await handled
  })

  it('createCdpFetchRuntime propagates CDP XHR resourceType onto the synthetic Express request', async () => {
    const client = {
      send: sinon.stub().callsFake(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      // Exercise the correlation fallback path: no pre-request arrives, so the
      // transport-normalized resourceType must survive onto req.
      shouldCorrelatePreRequests: () => true,
    })
    const seenResourceTypes: Array<string | undefined> = []
    const originalCreateMiddlewareContext = runtime.networkProxy.http.createMiddlewareContext.bind(runtime.networkProxy.http)

    sinon.stub(runtime.networkProxy.http, 'createMiddlewareContext').callsFake((req, res) => {
      seenResourceTypes.push(req.resourceType)

      return originalCreateMiddlewareContext(req, res)
    })

    // Resolve correlation immediately with no browserPreRequest so the
    // transport value is the only source of resourceType.
    sinon.stub(runtime.networkProxy.http.preRequests, 'get').callsFake((_req, _debug, cb) => {
      cb({ browserPreRequest: undefined })

      return undefined
    })

    const onRequestPaused = await startCdpRuntime(runtime, client)
    const handled = onRequestPaused(createPausedRequest({
      requestId: 'fetch-xhr',
      networkId: 'network-xhr',
      resourceType: 'XHR',
    }))

    await flush()

    await onRequestPaused(createPausedRequest({
      requestId: 'fetch-xhr',
      networkId: 'network-xhr',
      resourceType: 'XHR',
      responseStatusCode: 200,
    }))

    await flush()
    await handled

    expect(seenResourceTypes).to.include('xhr')
  })

  it('createCdpFetchRuntime fulfills strategy:file URLs from the file server without continueRequest', async () => {
    const client = {
      send: sinon.stub().resolves({}),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const deps = baseDeps()
    const fileBody = Buffer.from('"Joe","Smith"')

    deps.remoteStates.current = sinon.stub().returns({
      origin: 'http://localhost:2020',
      strategy: 'file',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    })

    deps.request = {
      rp: sinon.stub(),
      create: sinon.stub().resolves({
        statusCode: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="records.csv"',
        },
        body: fileBody,
      }),
    } as any

    const runtime = createCdpFetchRuntime({ ...deps, client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await onRequestPaused(createPausedRequest({
      requestId: 'file-request',
      networkId: 'network-file-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
    }))

    await flush()

    expect(deps.request.create).to.have.been.calledWithMatch({
      url: 'http://localhost:2021/cypress/fixtures/records.csv',
      headers: {
        'x-cypress-authorization': 'token',
      },
    }, true)

    const continueCall = client.send.getCalls().find((call) => call.args[0] === 'Fetch.continueRequest')
    const fulfillCall = client.send.getCalls().find((call) => call.args[0] === 'Fetch.fulfillRequest')

    expect(continueCall, 'expected no Fetch.continueRequest').to.not.exist
    expect(fulfillCall, 'expected Fetch.fulfillRequest').to.exist
    expect(fulfillCall!.args[1]).to.include({
      requestId: 'file-request',
      responseCode: 200,
    })

    expect(fulfillCall!.args[1].body).to.equal(fileBody.toString('base64'))
  })

  it('createCdpFetchRuntime fulfills download pauses without networkId without waiting for pre-request timeout', async function () {
    this.timeout(5000)

    const clock = sinon.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout'],
    })

    try {
      const client = {
        send: sinon.stub().resolves({}),
        on: sinon.stub(),
        off: sinon.stub(),
      }
      const deps = baseDeps()
      const fileBody = Buffer.from('"Joe","Smith"')
      const downloadUrl = 'http://localhost:2020/cypress/fixtures/records.csv'

      deps.remoteStates.current = sinon.stub().returns({
        origin: 'http://localhost:2020',
        strategy: 'file',
        fileServer: 'http://localhost:2021',
        domainName: 'localhost',
        props: null,
      })

      deps.request = {
        rp: sinon.stub(),
        create: sinon.stub().resolves({
          statusCode: 200,
          headers: {
            'content-type': 'text/csv',
            'content-disposition': 'attachment; filename="records.csv"',
          },
          body: fileBody,
        }),
      } as any

      const runtime = createCdpFetchRuntime({
        ...deps,
        client,
        shouldCorrelatePreRequests: () => true,
      })
      const addPendingSpy = sinon.spy(runtime.networkProxy, 'addPendingUrlWithoutPreRequest')
      const onRequestPaused = await startCdpRuntime(runtime, client)

      // Downloads omit networkId — without pre-registration CorrelateBrowserPreRequest
      // would wait the default 2000ms pre-request timeout before file-server-origin runs.
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'download-file-request',
        url: downloadUrl,
      }))

      await flush()
      await clock.tickAsync(0)
      await flush()

      expect(addPendingSpy).to.have.been.calledOnceWith(downloadUrl)
      expect(deps.request.create).to.have.been.calledOnce

      const fulfillCall = client.send.getCalls().find((call) => call.args[0] === 'Fetch.fulfillRequest')

      expect(fulfillCall, 'expected Fetch.fulfillRequest before pre-request timeout').to.exist
      expect(fulfillCall!.args[1]).to.include({
        requestId: 'download-file-request',
        responseCode: 200,
      })

      await handled
    } finally {
      clock.restore()
    }
  })

  it('createCdpFetchRuntime continues http-strategy requests without hitting the file server', async () => {
    const client = {
      send: sinon.stub().callsFake(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const deps = baseDeps()

    deps.request = {
      rp: sinon.stub(),
      create: sinon.stub().resolves({
        statusCode: 200,
        headers: {},
        body: 'should-not-be-used',
      }),
    } as any

    const runtime = createCdpFetchRuntime({ ...deps, client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    const handled = onRequestPaused(createPausedRequest({
      requestId: 'http-request',
      networkId: 'network-http-1',
      url: 'https://example.test/app',
    }))

    await flush()

    expect(deps.request.create).not.to.have.been.called

    const continueCall = client.send.getCalls().find((call) => call.args[0] === 'Fetch.continueRequest')

    expect(continueCall, 'expected Fetch.continueRequest').to.exist

    await onRequestPaused(createPausedRequest({
      requestId: 'http-request',
      networkId: 'network-http-1',
      url: 'https://example.test/app',
      responseStatusCode: 200,
    }))

    await flush()
    await handled
  })
})
