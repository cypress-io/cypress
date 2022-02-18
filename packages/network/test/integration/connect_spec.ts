import _ from 'lodash'
import Bluebird from 'bluebird'
import chai from 'chai'
import net from 'net'
import sinonChai from 'sinon-chai'
import * as connect from '../../lib/connect'

const expect = chai.expect

chai.use(sinonChai)

describe('lib/connect', function () {
  context('.getAddress', function () {
    it('resolves localhost on 127.0.0.1 immediately', function () {
      this.timeout(50)

      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      return Bluebird.fromCallback((cb) => {
        server.listen(0, '127.0.0.1', cb)
      })
      .then(() => {
        return connect.getAddress(server.address().port, 'localhost')
      })
      .then((address) => {
        expect(address).to.deep.eq({
          family: 4,
          address: '127.0.0.1',
        })
      })
      .then(() => {
        server.close()
      })
    })

    // Error: listen EADDRNOTAVAIL ::1
    // NOTE: add an ipv6 lo if to the docker container
    it.skip('resolves localhost on ::1 immediately', function () {
      this.timeout(50)

      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      return Bluebird.fromCallback((cb) => {
        server.listen(0, '::1', cb)
      })
      .then(() => {
        return connect.getAddress(server.address().port, 'localhost')
      })
      .then((address) => {
        expect(address).to.deep.eq({
          family: 6,
          address: '::1',
        })
      })
      .then(() => {
        server.close()
      })
    })
  })
})
