import { proxyquire } from '../../spec_helper'
import path from 'path'
import os from 'os'
import type { AppCaptureProtocolInterface, ProtocolManager as ProtocolManagerInterface } from '@packages/types'

const mockDb = sinon.stub()
const mockDatabase = sinon.stub().returns(mockDb)

const { default: ProtocolManager } = proxyquire('../lib/cloud/protocol', {
  'better-sqlite3': mockDatabase,
})

describe('lib/cloud/protocol', () => {
  let protocolManager: ProtocolManagerInterface
  let protocol: AppCaptureProtocolInterface

  beforeEach(async () => {
    process.env.CYPRESS_LOCAL_PROTOCOL_PATH = path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'protocol', 'test-protocol.js')

    protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    protocol = (protocolManager as any).protocol
  })

  afterEach(() => {
    delete process.env.CYPRESS_LOCAL_PROTOCOL_PATH
  })

  it('should be able to setup the protocol', () => {
    expect(protocolManager.protocolEnabled()).to.be.true
    expect((protocol as any).Debug).not.to.be.undefined
  })

  it('should be able to connect to the browser', async () => {
    const mockCdpClient = sinon.stub()

    sinon.stub(protocol, 'connectToBrowser').resolves()

    await protocolManager.connectToBrowser(mockCdpClient as any)

    expect(protocol.connectToBrowser).to.be.calledWith(mockCdpClient)
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

  it('should be able to clean up after a spec', () => {
    sinon.stub(protocol, 'afterSpec')

    protocolManager.afterSpec()

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
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogAdded(log, '2023-03-30T21:58:08.457Z')

    expect(protocol.commandLogAdded).to.be.calledWith(log, '2023-03-30T21:58:08.457Z')
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
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogChanged(log, '2023-03-30T21:58:08.457Z')

    expect(protocol.commandLogChanged).to.be.calledWith(log, '2023-03-30T21:58:08.457Z')
  })
})
