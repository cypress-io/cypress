import '../../spec_helper'
import ProtocolManager from '../../../lib/cloud/protocol'
import path from 'path'

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
    expect(protocol.CDP).not.to.be.undefined
    expect(protocol.CY_PROTOCOL_DIR).not.to.be.undefined
    expect(protocol.betterSqlite3Binding).not.to.be.undefined
    expect(protocol.nodePath).not.to.be.undefined
    expect(protocol.Database).not.to.be.undefined
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
      name: 'spec',
      relative: 'relative',
      absolute: 'absolute',
    })

    expect(protocol.beforeSpec).to.be.calledWith({
      name: 'spec',
      relative: 'relative',
      absolute: 'absolute',
    })
  })

  it('should be able to initialize a new test', async () => {
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

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
    const protocolManager = new ProtocolManager()

    await protocolManager.setupProtocol()

    const protocol = (protocolManager as any).protocol

    sinon.stub(protocol, 'afterSpec')

    protocolManager.afterSpec()

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

    protocolManager.addRunnables(rootRunnable)

    expect(protocol.addRunnables).to.be.calledWith(rootRunnable)
  })
})
