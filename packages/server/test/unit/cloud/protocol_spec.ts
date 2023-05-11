import fs from 'fs'

import { proxyquire } from '../../spec_helper'
import path from 'path'
import os from 'os'
import type { AppCaptureProtocolInterface, ProtocolManagerShape } from '@packages/types'
import { expect } from 'chai'

const mockDb = sinon.stub()
const mockDatabase = sinon.stub().returns(mockDb)

const { ProtocolManager } = proxyquire('../lib/cloud/protocol', {
  'better-sqlite3': mockDatabase,
}) as typeof import('@packages/server/lib/cloud/protocol')

const stubProtocol = fs.readFileSync(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'protocol', 'test-protocol.js'), 'utf8')

describe('lib/cloud/protocol', () => {
  let protocolManager: ProtocolManagerShape
  let protocol: AppCaptureProtocolInterface

  beforeEach(async () => {
    protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol(stubProtocol, '1')

    protocol = (protocolManager as any)._protocol
  })

  it('should be able to setup the protocol', () => {
    expect((protocol as any).Debug).not.to.be.undefined
  })

  it('should be able to connect to the browser', async () => {
    const mockCdpClient = {
      send: sinon.stub(),
      on: sinon.stub(),
    }

    const connectToBrowserStub = sinon.stub(protocol, 'connectToBrowser').resolves()

    await protocolManager.connectToBrowser(mockCdpClient as any)

    const newCdpClient = connectToBrowserStub.getCall(0).args[0]

    newCdpClient.send('Page.enable')
    expect(mockCdpClient.send).to.be.calledWith('Page.enable')

    const mockSuccess = sinon.stub().resolves()

    newCdpClient.on('Page.loadEventFired', mockSuccess)

    const mockRejects = sinon.stub().rejects()

    newCdpClient.on('Page.backForwardCacheNotUsed', mockRejects)

    await mockCdpClient.on.getCall(0).args[1]()
    expect(mockSuccess).to.be.called
    expect((protocolManager as any)._errors).to.be.empty

    await mockCdpClient.on.getCall(1).args[1]()
    expect(mockRejects).to.be.called
    expect((protocolManager as any)._errors.length).to.equal(1)
  })

  it('should be able to initialize a new spec', () => {
    sinon.stub(protocol, 'beforeSpec')

    protocolManager.beforeSpec({
      instanceId: 'instanceId',
    })

    expect(protocol.beforeSpec).to.be.calledWith(mockDb)
    expect(mockDatabase).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'), {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: sinon.match.func,
    })
  })

  it('should be able to initialize a new test', () => {
    sinon.stub(protocol, 'beforeTest')

    protocolManager.beforeTest({
      id: 'id',
      title: 'test',
      wallClockStartedAt: 1234,
    })

    expect(protocol.beforeTest).to.be.calledWith({
      id: 'id',
      title: 'test',
      wallClockStartedAt: 1234,
    })
  })

  it('should be able to clean up after a spec', async () => {
    sinon.stub(protocol, 'afterSpec')

    await protocolManager.afterSpec()

    expect(protocol.afterSpec).to.be.called
  })

  it('should be able to add runnables', () => {
    sinon.stub(protocol, 'addRunnables')

    const rootRunnable = {
      id: 'r1',
      type: 'suite',
      suites: [],
      tests: [
        {
          id: 'r2',
          name: 'test body',
          title: 'test 1',
          type: 'test',
        },
      ],
      hooks: [],
    }

    protocolManager.addRunnables(rootRunnable)

    expect(protocol.addRunnables).to.be.calledWith(rootRunnable)
  })

  it('should be able to add a command log', () => {
    sinon.stub(protocol, 'commandLogAdded')

    const log = {
      id: 'log-https://example.cypress.io-17',
      alias: 'getComment',
      aliasType: 'route',
      displayName: 'xhr',
      event: true,
      hookId: 'r4',
      instrument: 'command',
      message: '',
      method: 'GET',
      name: 'request',
      renderProps: {},
      state: 'pending',
      testId: 'r4',
      timeout: 0,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
      wallClockUpdatedAt: '2023-03-30T21:58:08.457Z',
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogAdded(log)

    expect(protocol.commandLogAdded).to.be.calledWith(log)
  })

  it('should be able to change a command log', () => {
    sinon.stub(protocol, 'commandLogChanged')

    const log = {
      id: 'log-https://example.cypress.io-17',
      alias: 'getComment',
      aliasType: 'route',
      displayName: 'xhr',
      event: true,
      hookId: 'r4',
      instrument: 'command',
      message: '',
      method: 'GET',
      name: 'request',
      renderProps: {},
      state: 'pending',
      testId: 'r4',
      timeout: 0,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
      wallClockUpdatedAt: '2023-03-30T21:58:08.457Z',
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogChanged(log)

    expect(protocol.commandLogChanged).to.be.calledWith(log)
  })

  it('should be able to handle changing the viewport', () => {
    sinon.stub(protocol, 'viewportChanged')

    const input = {
      viewport: {
        width: 100,
        height: 200,
      },
      timestamp: 1234,
    }

    protocolManager.viewportChanged(input)

    expect(protocol.viewportChanged).to.be.calledWith(input)
  })

  it('should be able to handle changing the url', () => {
    sinon.stub(protocol, 'urlChanged')

    const input = {
      url: 'https://example.cypress.io',
      timestamp: 1234,
    }

    protocolManager.urlChanged(input)

    expect(protocol.urlChanged).to.be.calledWith(input)
  })
})
