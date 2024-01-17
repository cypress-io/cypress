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
  let on: sinon.SinonStub
  let criImport: sinon.SinonStub & {
    New: sinon.SinonStub
  }
  let criStub: {
    send: typeof send
    on: typeof on
    close: sinon.SinonStub
    _notifier: EventEmitter
  }
  let onError: sinon.SinonStub
  let getClient: (options?: { host?: string, fullyManageTabs?: boolean }) => ReturnType<typeof create>

  beforeEach(function () {
    send = sinon.stub()
    onError = sinon.stub()
    on = sinon.stub()
    criStub = {
      on,
      send,
      close: sinon.stub().resolves(),
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

    getClient = ({ host, fullyManageTabs } = {}) => {
      return criClient.create({ target: DEBUGGER_URL, host, onAsynchronousError: onError, fullyManageTabs })
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

        client.send('DOM.getDocument', { depth: -1 })
        expect(send).to.be.calledWith('DOM.getDocument', { depth: -1 })
      })

      it('rejects if cri.send rejects', async function () {
        const err = new Error

        send.rejects(err)
        const client = await getClient()

        await expect(client.send('DOM.getDocument', { depth: -1 }))
        .to.be.rejectedWith(err)
      })

      it('rejects if target has crashed', async function () {
        const command = 'DOM.getDocument'
        const client = await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        await criStub.on.withArgs('Target.targetCrashed').args[0][1]({ targetId: DEBUGGER_URL })
        await expect(client.send(command, { depth: -1 })).to.be.rejectedWith(`${command} will not run as the target browser or tab CRI connection has crashed`)
      })

      it('does not reject if attachToTarget work throws', async function () {
        criStub.send.withArgs('Network.enable').throws(new Error('ProtocolError: Inspected target navigated or closed'))
        await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        // This would throw if the error was not caught
        await criStub.on.withArgs('Target.attachedToTarget').args[0][1]({ targetInfo: { type: 'worker' } })
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

            await client.send('DOM.getDocument', { depth: -1 })

            expect(send).to.be.calledTwice
          })
        })
      })

      context('closed', () => {
        it(`when socket is closed mid send'`, async function () {
          const err = new Error('WebSocket is not open: readyState 3 (CLOSED)')

          send.onFirstCall().rejects(err)

          const client = await getClient()

          await client.close()

          expect(client.send('DOM.getDocument', { depth: -1 })).to.be.rejectedWith('DOM.getDocument will not run as browser CRI connection was reset')
        })
      })
    })
  })

  describe('on reconnect', () => {
    it('resends *.enable commands', async () => {
      criStub._notifier.on = sinon.stub()

      const client = await getClient()

      client.send('Page.enable')
      // @ts-ignore
      client.send('Page.foo')
      // @ts-ignore
      client.send('Page.bar')
      client.send('Network.enable')
      // @ts-ignore
      client.send('Network.baz')

      // clear out previous calls before reconnect
      criStub.send.reset()

      // @ts-ignore
      await criStub.on.withArgs('disconnect').args[0][1]()

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Page.enable')
      expect(criStub.send).to.be.calledWith('Network.enable')
    })

    it('errors if reconnecting fails', async () => {
      criStub._notifier.on = sinon.stub()
      criStub.close.throws(new Error('could not reconnect'))

      await getClient()
      // @ts-ignore
      await criStub.on.withArgs('disconnect').args[0][1]()

      expect(onError).to.be.called

      const error = onError.lastCall.args[0]

      expect(error.messageMarkdown).to.equal('There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.')
      expect(error.isFatalApiErr).to.be.true
    })
  })
})
