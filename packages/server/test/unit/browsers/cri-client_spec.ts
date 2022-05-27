import EventEmitter from 'events'
import { create } from '../../../lib/browsers/cri-client'

const { expect, proxyquire, sinon } = require('../../spec_helper')

const DEBUGGER_URL = 'http://foo'
const HOST = '127.0.0.1'
const PORT = 50505

describe('lib/browsers/cri-client', function () {
  let criClient: {
    create: typeof create
  }
  let send: sinon.SinonStub
  let criImport: sinon.SinonStub & {
    New: sinon.SinonStub
  }
  let criStub: {
    send: typeof send
    close: sinon.SinonStub
    _notifier: EventEmitter
  }
  let onError: sinon.SinonStub
  let getClient: () => ReturnType<typeof create>

  beforeEach(function () {
    send = sinon.stub()
    onError = sinon.stub()
    criStub = {
      send,
      close: sinon.stub(),
      _notifier: new EventEmitter(),
    }

    criImport = sinon.stub()
    .withArgs({
      target: DEBUGGER_URL,
      local: true,
    })
    .resolves(criStub)

    criImport.New = sinon.stub().withArgs({ host: HOST, port: PORT, url: 'about:blank' }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })

    criClient = proxyquire('../lib/browsers/cri-client', {
      'chrome-remote-interface': criImport,
    })

    getClient = () => {
      return criClient.create({
        target: DEBUGGER_URL,
        onError,
      })
    }
  })

  context('.create', function () {
    it('returns an instance of the CRI client', async function () {
      const client = await getClient()

      expect(client.send).to.be.instanceOf(Function)
    })

    context('#send', function () {
      it('calls cri.send with command and data', async function () {
        send.resolves()
        const client = await getClient()

        client.send('Browser.getVersion', { baz: 'quux' })
        expect(send).to.be.calledWith('Browser.getVersion', { baz: 'quux' })
      })

      it('rejects if cri.send rejects', async function () {
        const err = new Error

        send.rejects(err)
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

            send.onFirstCall().rejects(err)
            send.onSecondCall().resolves()

            const client = await getClient()

            await client.send('Browser.getVersion', { baz: 'quux' })

            expect(send).to.be.calledTwice
          })
        })
      })
    })
  })

  describe('on reconnect', () => {
    it('resends *.enable commands', async () => {
      criStub._notifier.on = sinon.stub()

      const client = await getClient()

      client.send('Page.enable')
      client.send('Page.foo')
      client.send('Page.bar')
      client.send('Network.enable')
      client.send('Network.baz')

      // clear out previous calls before reconnect
      criStub.send.reset()

      // @ts-ignore
      await criStub._notifier.on.withArgs('disconnect').args[0][1]()

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Page.enable')
      expect(criStub.send).to.be.calledWith('Network.enable')
    })
  })
})
