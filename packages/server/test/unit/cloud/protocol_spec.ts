import { proxyquire } from '../../spec_helper'
import path from 'path'
import os from 'os'

const mockDb = sinon.stub()
const mockDatabase = sinon.stub().returns(mockDb)

const { default: ProtocolManager } = proxyquire('../lib/cloud/protocol', {
  'better-sqlite3': mockDatabase,
})

describe('lib/cloud/protocol', () => {
  beforeEach(() => {
    process.env.CYPRESS_LOCAL_PROTOCOL_PATH = path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'protocol', 'test-protocol.js')
  })

  afterEach(() => {
    delete process.env.CYPRESS_LOCAL_PROTOCOL_PATH
  })

  it('should be able to setup the protocol', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

    expect(protocolManager.protocolEnabled()).to.be.true
    expect(protocol.Debug).not.to.be.undefined
    expect(protocol.Kysely).not.to.be.undefined
    expect(protocol.SqliteDialect).not.to.be.undefined
  })

  it('should be able to connect to the browser', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

    sinon.stub(protocol, 'connectToBrowser').resolves()

    await protocolManager.connectToBrowser({
      target: 'target',
      host: 'host',
      port: 1234,
    })

    expect(protocol.connectToBrowser).to.be.calledWith({
      target: 'target',
      host: 'host',
      port: 1234,
    })
  })

  it('should be able to initialize a new spec', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

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

  it('should be able to initialize a new test', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

    sinon.stub(protocol, 'beforeTest')

    await protocolManager.beforeTest({
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
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

    sinon.stub(protocol, 'afterSpec')

    await protocolManager.afterSpec()

    expect(protocol.afterSpec).to.be.called
  })

  it('should be able to add runnables', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

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

    await protocolManager.addRunnables(rootRunnable)

    expect(protocol.addRunnables).to.be.calledWith(rootRunnable)
  })
})
