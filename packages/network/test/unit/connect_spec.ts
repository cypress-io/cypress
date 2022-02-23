import { connect } from '../..'
import { expect } from 'chai'
import sinon from 'sinon'
import net from 'net'

describe('lib/connect', () => {
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
})
