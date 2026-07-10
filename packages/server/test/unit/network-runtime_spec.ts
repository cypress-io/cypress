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
      getPrimary: sinon.stub(),
      reset: sinon.stub(),
    } as any,
    getFileServerToken: () => 'token',
    getCookieJar: () => ({}) as any,
    socket: {
      toDriver: sinon.stub(),
    } as any,
    request: {} as any,
    serverBus: { emit: sinon.stub() } as any,
    getCurrentBrowser: () => ({}) as any,
  })

  function createPausedRequest (options: {
    requestId: string
    networkId?: string
    url?: string
    responseStatusCode?: number
  }): Protocol.Fetch.RequestPausedEvent {
    return {
      requestId: options.requestId,
      networkId: options.networkId,
      frameId: 'frame-1',
      resourceType: 'Document',
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

  it('createCdpFetchRuntime wires CDP Fetch without the legacy proxy pipeline', () => {
    const client = {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const isAUTFrame = sinon.stub().resolves(true)
    const runtime = createCdpFetchRuntime({
      client,
      isAUTFrame,
    })

    expect(runtime.networkInterception).to.exist
    expect(runtime.networkInterceptionCore).to.be.instanceOf(NetworkInterceptionCore)
    expect(runtime.networkPolicyRegistration).to.exist
    expect(runtime.fetchTransport).to.exist
    expect(runtime).not.to.have.property('networkProxy')
  })

  it('createCdpFetchRuntime starts Fetch interception and continues requests by default', async () => {
    const client = {
      send: sinon.stub().resolves({}),
      on: sinon.stub(),
      off: sinon.stub(),
    }
    const runtime = createCdpFetchRuntime({ client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await onRequestPaused(createPausedRequest({
      requestId: 'fetch-request',
      networkId: 'network-1',
    }))

    await tick()

    expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
      requestId: 'fetch-request',
    })
  })
})
