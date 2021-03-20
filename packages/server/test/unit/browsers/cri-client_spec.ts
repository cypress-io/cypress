import Bluebird from 'bluebird'
import { create } from '../../../lib/browsers/cri-client'
import EventEmitter from 'events'

const { expect, proxyquire, sinon } = require('../../spec_helper')

const DEBUGGER_URL = 'http://foo'

describe('lib/browsers/cri-client', function () {
  let criClient: {
    create: typeof create
  }
  let send: sinon.SinonStub
  let sendRaw: sinon.SinonStub
  let criStub: any
  let criImport: sinon.SinonStub
  let onError: sinon.SinonStub
  let getClient: (opts?: any) => ReturnType<typeof create>

  beforeEach(function () {
    sinon.stub(Bluebird, 'promisify').returnsArg(0)

    send = sinon.stub()
    sendRaw = sinon.stub()
    onError = sinon.stub()

    criStub = {
      send,
      sendRaw,
      on: sinon.stub(),
      close: sinon.stub(),
      _notifier: new EventEmitter(),
    }

    criImport = sinon.stub()
    .withArgs({
      target: DEBUGGER_URL,
      local: true,
    })
    .resolves(criStub)

    criClient = proxyquire('../lib/browsers/cri-client', {
      'chrome-remote-interface': criImport,
    })

    getClient = (opts = { target: DEBUGGER_URL }) => criClient.create(opts, onError)
  })

  context('.create', function () {
    it('returns an instance of the CRI client', async function () {
      const client = await getClient()

      expect(client.send).to.be.instanceOf(Function)
    })

    context('with process', function () {
      let process: any

      beforeEach(function () {
        process = { /** stubbed */}

        criImport.withArgs({
          process,
          local: true,
        })
        .resolves(criStub)
      })

      it('finds and attaches to target and persists sessionId', async function () {
        const target = {
          targetId: 'good',
          type: 'page',
          url: 'about:blank',
        }

        const otherTarget = {
          targetId: 'bad',
        }

        send
        .withArgs('Target.setDiscoverTargets').resolves()
        .withArgs('Target.getTargets').resolves({ targetInfos: [otherTarget, target] })
        .withArgs('Target.attachToTarget', { targetId: 'good', flatten: true }).resolves({ sessionId: 'session-1' })

        sendRaw.resolves()

        const client = await getClient({ process })

        await client.send('Browser.getVersion')

        expect(sendRaw).to.be.calledWith({
          method: 'Browser.getVersion',
          params: undefined,
          sessionId: 'session-1',
        })
      })
    })

    context('#send', function () {
      it('calls cri.sendRaw with command and data', async function () {
        sendRaw.resolves()
        const client = await getClient()

        client.send('Browser.getVersion', { baz: 'quux' })
        expect(sendRaw).to.be.calledWith({
          method: 'Browser.getVersion',
          params: { baz: 'quux' },
        })
      })

      it('rejects if cri.sendRaw rejects', async function () {
        const err = new Error

        sendRaw.rejects(err)
        const client = await getClient()

        await expect(client.send('Browser.getVersion', { baz: 'quux' }))
        .to.be.rejectedWith(err)
      })

      context('retries', () => {
        ([
          'WebSocket is not open',
          // @see https://github.com/cypress-io/cypress/issues/7180
          'WebSocket is already in CLOSING or CLOSED state',
        ]).forEach((msg) => {
          it(`with '${msg}'`, async function () {
            const err = new Error(msg)

            sendRaw.onFirstCall().rejects(err)
            sendRaw.onSecondCall().resolves()

            const client = await getClient()

            await client.send('Browser.getVersion', { baz: 'quux' })

            expect(sendRaw).to.be.calledTwice
          })
        })
      })
    })

    context('#ensureMinimumProtocolVersion', function () {
      function withProtocolVersion (actual, test) {
        if (actual) {
          sendRaw.withArgs({
            method: 'Browser.getVersion',
            params: undefined,
          })
          .resolves({ protocolVersion: actual })
        }

        return getClient()
        .then((client) => {
          return client.ensureMinimumProtocolVersion(test)
        })
      }

      it('resolves if protocolVersion = current', function () {
        return expect(withProtocolVersion('1.3', '1.3')).to.be.fulfilled
      })

      it('resolves if protocolVersion > current', function () {
        return expect(withProtocolVersion('1.4', '1.3')).to.be.fulfilled
      })

      it('rejects if Browser.getVersion not supported yet', function () {
        send.withArgs('Browser.getVersion')
        .rejects()

        return expect(withProtocolVersion(null, '1.3')).to.be
        .rejectedWith('A minimum CDP version of v1.3 is required, but the current browser has an older version.')
      })

      it('rejects if protocolVersion < current', function () {
        return expect(withProtocolVersion('1.2', '1.3')).to.be
        .rejectedWith('A minimum CDP version of v1.3 is required, but the current browser has v1.2.')
      })
    })
  })
})
