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
      // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23155
      this.retries(15)
      this.timeout(50)

      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      return Bluebird.fromCallback((cb) => {
        server.listen({
          port: 0,
          host: '127.0.0.1',
        }, cb.bind(server))
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
        return Bluebird.fromCallback((cb) => {
          server.close(cb)
        })
      })
    })

    // Error: listen EADDRNOTAVAIL ::1
    // NOTE: add an ipv6 lo if to the docker container
    it('resolves localhost on ::1 immediately', function () {
      // If we are on CI and IPV6 is explicitly disabled (like in the contributor PR workflow)
      // then we skip this test
      if (process.env.CIRCLE_IPV6_DISABLED) {
        this.skip()
      }

      this.timeout(50)

      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      return Bluebird.fromCallback((cb) => {
        server.listen({
          port: 0,
          host: '::1',
        }, cb.bind(server))
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
        return Bluebird.fromCallback((cb) => {
          server.close(cb)
        })
      })
    })
  })
})
