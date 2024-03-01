process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import Debug from 'debug'
import _ from 'lodash'
import { Server as WebSocketServer } from 'ws'
import { CdpCommand, CdpEvent } from '../../lib/browsers/cdp_automation'
import * as CriClient from '../../lib/browsers/cri-client'
import { expect, nock } from '../spec_helper'

import type { SinonStub } from 'sinon'
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

  let wsSrv: WebSocketServer
  let criClient: CriClient.CriClient
  let messages: object[]
  let onMessage: SinonStub

  const startWsServer = async (onConnection?: OnWSConnection): Promise<WebSocketServer> => {
    return new Promise((resolve, reject) => {
      const srv = new WebSocketServer({
        port: wsServerPort,
      })

      srv.on('connection', (ws) => {
        if (onConnection) {
          onConnection(ws)
        }

        // eslint-disable-next-line no-console
        ws.on('error', console.error)
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString())

          messages.push(msg)
          onMessage(msg)

          // ACK back if we have a msg.id
          if (msg.id) {
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
        })

        criClient.onReconnectAttempt = stub

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
        })

        criClient.onReconnectAttempt = stub

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

      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = reject

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
        })

        criClient.onReconnectAttempt = stub

        const send = (commands: CDPCommands[]) => {
          commands.forEach(({ command, params }) => {
            criClient.send(command, params).catch(() => {})
          })
        }

        const on = (subscriptions: CDPSubscriptions[]) => {
          subscriptions.forEach(({ eventName, cb }) => {
            criClient.on(eventName, cb)
          })
        }

        // send these in before we disconnect
        send(enableCommands)

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])

        // expect 6 message calls
        onMessage = sinon.stub().onCall(5).callsFake(resolve)

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

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
        })

        const stub = sinon.stub().onThirdCall().callsFake(async () => {
          criClient.close()
          .finally(() => {
            resolve(stub)
          })
        })

        criClient.onReconnectAttempt = stub

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])
      })
      .then((stub) => {
        expect(criClient.closed).to.be.true
        expect((stub as SinonStub).callCount).to.be.eq(3)
      })
    })
  })
})
