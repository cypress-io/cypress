import { describe, it, expect } from 'vitest'
import _ from 'lodash'
import net, { AddressInfo } from 'net'
import * as connect from '../../lib/connect'

describe('lib/connect', function () {
  describe('.getAddress', function () {
    it('resolves localhost on 127.0.0.1 immediately', {
      // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23155
      retry: 15,
      timeout: 50,
    }, async () => {
      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      // start the server
      await new Promise<void>((resolve) => {
        server.listen({
          port: 0,
          host: '127.0.0.1',
        }, resolve)
      })

      const address = await connect.getAddress((server.address() as AddressInfo).port, 'localhost')

      expect(address).toEqual({
        family: 4,
        address: '127.0.0.1',
      })

      // stop the server
      await new Promise<Error>((resolve) => {
        server.close(resolve)
      })
    })

    // Error: listen EADDRNOTAVAIL ::1
    // NOTE: add an ipv6 lo if to the docker container
    it('resolves localhost on ::1 immediately', {
      timeout: 50,
    }, async () => {
      const server = net.createServer(_.partialRight(_.invoke, 'close'))

      // start the server
      await new Promise<void>((resolve) => {
        server.listen({
          port: 0,
          host: '::1',
        }, resolve)
      })

      const address = await connect.getAddress((server.address() as AddressInfo).port, 'localhost')

      expect(address).toEqual({
        family: 6,
        address: '::1',
      })

      // stop the server
      await new Promise<Error>((resolve) => {
        server.close(resolve)
      })
    })
  })
})
