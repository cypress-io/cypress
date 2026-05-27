import { NetworkProxy } from '@packages/proxy'
import { NetworkInterceptionCore } from '@packages/network-interception'
import { createProxyRuntime } from '../../lib/network-runtime'
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

    expect(policies).to.have.length(1)
    expect(policies[0].name).to.eq('blocked-hosts')
    expect(policies[0].when({ url: 'http://localhost:3131/' })).to.be.true
    expect(runtime.networkInterceptionCore).to.be.instanceOf(NetworkInterceptionCore)
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
})
