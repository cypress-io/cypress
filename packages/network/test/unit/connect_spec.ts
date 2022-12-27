import { connect } from '../..'
import { expect } from 'chai'
import sinon from 'sinon'
import net from 'net'
import type { RetryingOptions } from '../../lib/connect'

describe('lib/connect', () => {
  afterEach(() => {
    sinon.restore()
  })

  context('.byPortAndAddress', () => {
    it('destroy connection immediately onConnect', () => {
      const socket = new net.Socket()
      const destroy = sinon.spy(socket, 'destroy')

      sinon.stub(net, 'connect').callsFake((port, address, onConnect) => {
        process.nextTick(() => {
          onConnect()
        })

        return socket
      })

      return connect.byPortAndAddress(1234, { address: '127.0.0.1' })
      .then((address) => {
        expect(address).to.deep.eq({ address: '127.0.0.1' })
        expect(destroy).to.be.called
      })
    })
  })

  context('createRetryingSocket', () => {
    it('cancels retries', (done) => {
      const getDelayMsForRetry = (iteration) => {
        if (iteration < 2) {
          return 1
        }

        // return undefined to cancel any additional retries
        return
      }

      const opts: RetryingOptions = {
        family: 0,
        useTls: false,
        port: 3000,
        host: '127.0.0.1',
        getDelayMsForRetry,
      }

      const netSpy = sinon.spy(net, 'connect')

      connect.createRetryingSocket(opts, (err: any, sock, _retry) => {
        expect((err)?.code).to.equal('ECONNREFUSED')
        expect(netSpy).to.be.calledThrice
        expect(sock).to.be.undefined
        done()
      })
    })
  })
})
