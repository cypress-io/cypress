import { proxyquire } from '../../spec_helper'
import path from 'path'
import os from 'os'
import type { AppCaptureProtocolInterface, ProtocolManagerShape } from '@packages/types'
import { expect } from 'chai'
import { EventEmitter } from 'stream'
import esbuild from 'esbuild'

class TestClient extends EventEmitter {
  send: sinon.SinonStub = sinon.stub()
}

const mockDb = sinon.stub()
const mockDatabase = sinon.stub().returns(mockDb)

const { ProtocolManager } = proxyquire('../lib/cloud/protocol', {
  'better-sqlite3': mockDatabase,
}) as typeof import('@packages/server/lib/cloud/protocol')

const { outputFiles: [{ contents: stubProtocolRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'protocol', 'test-protocol.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubProtocol = new TextDecoder('utf-8').decode(stubProtocolRaw)

describe('lib/cloud/protocol', () => {
  let protocolManager: ProtocolManagerShape
  let protocol: AppCaptureProtocolInterface

  beforeEach(async () => {
    protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol(stubProtocol, { runId: '1', testingType: 'e2e' })

    protocol = (protocolManager as any)._protocol
    expect((protocol as any)).not.to.be.undefined
  })

  it('should be able to connect to the browser', async () => {
    const mockCdpClient = new TestClient()

    const connectToBrowserStub = sinon.stub(protocol, 'connectToBrowser').resolves()

    await protocolManager.connectToBrowser(mockCdpClient as any)

    const newCdpClient = connectToBrowserStub.getCall(0).args[0]

    newCdpClient.send('Page.enable')
    expect(mockCdpClient.send).to.be.calledWith('Page.enable')

    const mockSuccess = sinon.stub()

    newCdpClient.on('Page.loadEventFired', mockSuccess)

    const mockThrows = sinon.stub().throws()

    newCdpClient.on('Page.backForwardCacheNotUsed', mockThrows)

    mockCdpClient.emit('Page.loadEventFired')

    expect(mockSuccess).to.be.called
    expect((protocolManager as any)._errors).to.be.empty

    mockCdpClient.emit('Page.backForwardCacheNotUsed', { test: 'test1' })

    expect(mockThrows).to.be.called
    expect((protocolManager as any)._errors).to.have.length(1)
    expect((protocolManager as any)._errors[0].captureMethod).to.equal('cdpClient.on')
    expect((protocolManager as any)._errors[0].args).to.deep.equal([
      'Page.backForwardCacheNotUsed',
      {
        test: 'test1',
      },
    ])
  })

  it('should be able to initialize a new spec', () => {
    sinon.stub(protocol, 'beforeSpec')

    ;(protocolManager as any)._errors = [
      {
        captureMethod: 'cdpClient.on',
      },
    ]

    protocolManager.beforeSpec({
      instanceId: 'instanceId',
    })

    expect((protocolManager as any)._errors).to.be.empty

    expect(protocol.beforeSpec).to.be.calledWith({
      workingDirectory: path.join(os.tmpdir(), 'cypress', 'protocol'),
      archivePath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.tar'),
      dbPath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'),
      db: mockDb,
    })

    expect(mockDatabase).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'), {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: sinon.match.func,
    })
  })

  it('should be able to initialize a new test', async () => {
    sinon.stub(protocol, 'beforeTest')

    await protocolManager.beforeTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.beforeTest).to.be.calledWith({
      id: 'id',
      title: 'test',
    })
  })

  it('should be able to clean up after a spec', async () => {
    sinon.stub(protocol, 'afterSpec')

    await protocolManager.afterSpec()

    expect(protocol.afterSpec).to.be.called
  })

  it('should be able to handle pre-after test', async () => {
    sinon.stub(protocol, 'preAfterTest')

    await protocolManager.preAfterTest({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })

    expect(protocol.preAfterTest).to.be.calledWith({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })
  })

  it('should be able to clean up after a test', async () => {
    sinon.stub(protocol, 'afterTest')

    await protocolManager.afterTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.afterTest).to.be.calledWith({
      id: 'id',
      title: 'test',
    })
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
      createdAtTimestamp: 1689619127850.2854,
      updatedAtTimestamp: 1689619127851.2854,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
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
      createdAtTimestamp: 1689619127850.2854,
      updatedAtTimestamp: 1689619127851.2854,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
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

  it('should be able to handle the page loading', () => {
    sinon.stub(protocol, 'pageLoading')

    const input = {
      loading: true,
      timestamp: 1234,
    }

    protocolManager.pageLoading(input)

    expect(protocol.pageLoading).to.be.calledWith(input)
  })

  it('should be able to reset the test', () => {
    sinon.stub(protocol, 'resetTest')

    const testId = 'r3'

    protocolManager.resetTest(testId)

    expect(protocol.resetTest).to.be.calledWith(testId)
  })
})
