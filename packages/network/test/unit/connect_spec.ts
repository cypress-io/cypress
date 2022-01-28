import { connect } from '../..'
import { expect } from 'chai'
import sinon from 'sinon'
import net from 'net'
import tls from 'tls'

describe('lib/connect', () => {
  context('.byPortAndAddress', () => {
    it('connects net/tls when depends on port used', () => {
      sinon.spy(net, 'connect')
      connect.byPortAndAddress('foo.bar', 1234, { address: '127.0.0.1' })
      expect(net.connect).to.be.calledWith({ host: '127.0.0.1', port: 1234 })

      sinon.spy(tls, 'connect')
      connect.byPortAndAddress('foo.bar', 443, { address: '127.0.0.1' })
      expect(tls.connect).to.be.calledWith({ host: '127.0.0.1', port: 443, servername: 'foo.bar' })
    })
  })
})
