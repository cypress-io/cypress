process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import Debug from 'debug'
import _ from 'lodash'
import WebSocket from 'ws'
import { CdpCommand, CdpEvent } from '../../lib/browsers/cdp_automation'
import { CriClient } from '../../lib/browsers/cri-client'
import { expect, nock } from '../spec_helper'
import pDefer from 'p-defer'
import sinon from 'sinon'

// import Bluebird from 'bluebird'

const debug = Debug('cypress:server:tests')

const wsServerPort = 20000

type CDPCommands = {
  command: CdpCommand
  params?: object
}

type CDPSubscriptions = {
  eventName: CdpEvent
  cb: () => void
}

type OnWSConnection = (wsClient: WebSocket) => void

describe('CDP Clients', () => {
  require('mocha-banner').register()

  let wsSrv: WebSocket.Server
  let criClient: CriClient
  let messages: object[]
  let onMessage: sinon.SinonStub
  let messageResponse: ReturnType<typeof pDefer>
  let neverAck: boolean

  const startWsServer = async (onConnection?: OnWSConnection): Promise<WebSocket.Server> => {
    return new Promise((resolve, reject) => {
      const srv = new WebSocket.Server({
        port: wsServerPort,
      })

      srv.on('connection', (ws) => {
        if (onConnection) {
          onConnection(ws)
        }

        // eslint-disable-next-line no-console
        ws.on('error', console.error)
        ws.on('message', async (data) => {
          const msg = JSON.parse(data.toString())

          messages.push(msg)
          onMessage(msg)

          if (neverAck) {
            return
          }

          // ACK back if we have a msg.id
          if (msg.id) {
            if (messageResponse) {
              const message = await messageResponse.promise

              ws.send(JSON.stringify({ id: msg.id, result: message }))

              return
            }

            ws.send(JSON.stringify({
              id: msg.id,
              result: {},
            }))
          }
        })
      })

      srv.on('error', reject)
      srv.on('listening', () => {
        resolve(srv)
      })
    })
  }

  const closeWsServer = () => {
    debug('closing websocket server')

    return new Promise((resolve, reject) => {
      wsSrv.close((err) => {
        if (err) {
          return reject(err)
        }

        debug('closed websocket server')
        resolve(undefined)
      })
    })
  }

  const clientDisconnected = () => {
    return new Promise((resolve, reject) => {
      criClient.ws.once('close', resolve)
    })
  }

  beforeEach(async () => {
    messageResponse = undefined
    messages = []

    onMessage = sinon.stub()

    nock.enableNetConnect()

    wsSrv = await startWsServer()
  })

  afterEach(async () => {
    await criClient.close().catch(() => { })
    await closeWsServer()
  })

  context('reconnect after disconnect', () => {
    it('retries to connect', async () => {
      const stub = sinon.stub()

      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = reject
        const onReconnect = resolve

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])

        wsSrv = await startWsServer()
      })
      .then((client) => {
        expect(client).to.eq(criClient)

        expect(stub).to.be.calledWith(1)
        expect(stub.callCount).to.be.gte(1)
      })
    })

    it('retries up to 20 times and then throws an error', () => {
      const stub = sinon.stub()

      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = resolve
        const onReconnect = reject

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])
      })
      .then((err) => {
        expect(err).to.have.property('type', 'CDP_COULD_NOT_RECONNECT')
        expect(err).to.have.property('isFatalApiErr', true)

        expect(stub).to.be.calledWith(20)
        expect(stub.callCount).to.be.eq(20)
      })
    })

    it('continuously re-sends commands that fail due to disconnect, until target is closed', async () => {
      /**
       * This test is specifically for the case when a CRIClient websocket trampolines, and
       * enqueued messages fail due to a disconnected websocket.
       *
       * That happens if a command fails due to an in-flight disconnect, and then fails again
       * after being enqueued due to an in-flight disconnect.
       *
       * The steps taken here to reproduce:
       * 1. Connect to the websocket
       * 2. Send the command, and wait for it to be received by the websocket (but not responded to)
       * 3. Disconnect the websocket
       * 4. Allow the websocket to be reconnected after 3 tries, and wait for successful reconnection
       * 5. Wait for the command to be re-sent and received by the websocket (but not responded to)
       * 6. Disconnect the websocket.
       * 7. Allow the websocket to be reconnected after 3 tries, and wait for successful reconnection
       * 8. Wait for the command to be resent, received, and responded to successfully.
       */
      neverAck = true
      const command: CDPCommands = {
        command: 'DOM.getDocument',
        params: { depth: -1 },
      }
      let reconnectPromise = pDefer()
      let commandSent = pDefer()
      const reconnectOnThirdTry = sinon.stub().onThirdCall().callsFake(async () => {
        wsSrv = await startWsServer((ws) => {
        })
      })

      const onReconnect = sinon.stub().callsFake(() => {
        reconnectPromise.resolve()
      })

      criClient = await CriClient.create({
        target: `ws://127.0.0.1:${wsServerPort}`,
        onAsynchronousError: (e) => commandSent.reject(e),
        onReconnect,
        onReconnectAttempt: reconnectOnThirdTry,
      })

      onMessage.callsFake(() => {
        commandSent.resolve()
      })

      const cmdExecution = criClient.send(command.command, command.params)

      await commandSent.promise
      await Promise.all([clientDisconnected(), closeWsServer()])

      commandSent = pDefer()
      onMessage.resetHistory()

      reconnectOnThirdTry.resetHistory()

      await reconnectPromise.promise
      await commandSent.promise
      await Promise.all([clientDisconnected(), closeWsServer()])

      reconnectOnThirdTry.resetHistory()

      reconnectPromise = pDefer()

      // set up response value
      messageResponse = pDefer()

      neverAck = false

      await reconnectPromise.promise

      messageResponse.resolve({ response: true })

      const res: any = await cmdExecution

      expect(res.response).to.eq(true)
    })

    it('restores sending enqueued commands, subscriptions, and enable commands on reconnect', () => {
      const enableCommands: CDPCommands[] = [
        { command: 'Page.enable', params: {} },
        { command: 'Network.enable', params: {} },
        { command: 'Runtime.addBinding', params: { name: 'foo' } },
        { command: 'Target.setDiscoverTargets', params: { discover: true } },
      ]

      const enqueuedCommands: CDPCommands[] = [
        { command: 'Page.navigate', params: { url: 'about:blank' } },
        { command: 'Performance.getMetrics', params: {} },
      ]

      const cb = sinon.stub()

      const subscriptions: CDPSubscriptions[] = [
        { eventName: 'Network.requestWillBeSent', cb },
        { eventName: 'Network.responseReceived', cb },
      ]

      let wsClient

      const stub = sinon.stub().onThirdCall().callsFake(async () => {
        wsSrv = await startWsServer((ws) => {
          wsClient = ws
        })
      })

      const onReconnect = sinon.stub()

      return new Promise<void>(async (resolve, reject) => {
        const onAsynchronousError = reject

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        const send = (commands: CDPCommands[]) => {
          commands.forEach(({ command, params }) => {
            criClient.send(command, params)
          })
        }

        const on = (subscriptions: CDPSubscriptions[]) => {
          subscriptions.forEach(({ eventName, cb }) => {
            criClient.on(eventName, cb)
          })
        }

        // send these in before we disconnect
        send(enableCommands)
        // expect 5 message calls
        onMessage.reset()
        onMessage.onCall(4).callsFake(() => {
          resolve()
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])

        // now enqueue these commands
        send(enqueuedCommands)
        on(subscriptions)

        const { queue } = criClient

        // assert they're in the queue
        expect(queue.enqueuedCommands).to.containSubset(enqueuedCommands)
        expect(queue.enableCommands).to.containSubset(enableCommands)
        expect(queue.subscriptions).to.containSubset(subscriptions.map(({ eventName, cb }) => {
          return {
            eventName,
            cb: _.isFunction,
          }
        }))
      })
      .then(() => {
        const { queue } = criClient

        expect(queue.enqueuedCommands).to.be.empty
        expect(queue.enableCommands).not.to.be.empty
        expect(queue.subscriptions).not.to.be.empty

        const messageCalls = _
        .chain(onMessage.args)
        .flatten()
        .map(({ method, params }) => {
          return {
            command: method,
            params: params ?? {},
          }
        })
        .value()

        expect(onMessage).to.have.callCount(6)
        expect(messageCalls).to.deep.eq(
          _.concat(
            enableCommands,
            enqueuedCommands,
          ),
        )

        return new Promise((resolve) => {
          cb.onSecondCall().callsFake(resolve)

          wsClient.send(JSON.stringify({
            method: 'Network.requestWillBeSent',
            params: { foo: 'bar' },
          }))

          wsClient.send(JSON.stringify({
            method: 'Network.responseReceived',
            params: { baz: 'quux' },
          }))
        })
      })
      .then(() => {
        expect(cb.firstCall).to.be.calledWith({ foo: 'bar' })
        expect(cb.secondCall).to.be.calledWith({ baz: 'quux' })
      })
    })

    it('stops reconnecting after close is called', () => {
      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = reject
        const onReconnect = reject

        const stub = sinon.stub().onThirdCall().callsFake(async () => {
          criClient.close()
          .finally(() => {
            resolve(stub)
          })
        })

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])
      })
      .then((stub) => {
        expect(criClient.closed).to.be.true
        expect((stub as sinon.SinonStub).callCount).to.be.eq(3)
      })
    })
  })
})
