import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import EE from 'events'
import { create as createServer, reset as resetServers } from '../../lib/server'
import { CA } from '../../lib/ca'
import type { Server } from '../../lib/server'
import type { Socket } from 'net'
import type { IncomingMessage } from 'http'

vi.mock('../../lib/ca')

describe('lib/server', () => {
  let port: number
  let ca: CA
  let setup: (options?: any) => Promise<Server>

  beforeEach(function () {
    vi.unstubAllEnvs()
    setup = async (options = {}) => {
      ca = await CA.create()
      port = 12345

      return createServer(ca, port, options)
    }
  })

  describe('#listen', () => {
    it('calls options.onUpgrade with req, socket head', async function () {
      const onUpgrade = vi.fn()

      const srv = await setup({ onUpgrade })

      srv._sniServer.emit('upgrade', 1, 2, 3)

      expect(onUpgrade).toHaveBeenCalledWith(1, 2, 3)
    })

    it('calls options.onRequest with req, res', async function () {
      const onRequest = vi.fn()
      const req = { url: 'https://www.foobar.com', headers: { host: 'www.foobar.com' } }
      const res = {}

      const srv = await setup({ onRequest })

      srv._sniServer.emit('request', req, res)

      expect(onRequest).toHaveBeenCalledWith(req, res)
    })

    it('calls options.onError with err and port and destroys the client socket', async function () {
      const socket = new EE() as Socket

      socket.destroy = vi.fn()
      const head: Buffer = Buffer.from('')

      return new Promise<void>(async (resolve) => {
        const onError = function (err: Error, socket2: Socket, head2: Buffer, port: string) {
          expect(err.message).toEqual('connect ECONNREFUSED 127.0.0.1:8444')

          expect(socket).toEqual(socket2)
          expect(head).toEqual(head2)
          expect(port).toEqual('8444')

          expect(socket.destroy).toHaveBeenCalledOnce()

          resolve()
        }

        const srv = await setup({ onError })

        srv._makeConnection(socket, head, '8444', 'localhost')
      })
    })

    // https://github.com/cypress-io/cypress/issues/3250
    it('does not crash when an erroneous URL is provided, just destroys socket', function () {
      const socket = new EE() as Socket

      socket.destroy = vi.fn()
      const head: Buffer = Buffer.from('')

      return new Promise<void>(async (resolve) => {
        const onError = function (err: Error, socket2: Socket, head2: Buffer, port: string) {
          expect(err.message).toEqual('getaddrinfo ENOTFOUND %7Balgolia_application_id%7D-dsn.algolia.net')

          expect(socket).toEqual(socket2)
          expect(head).toEqual(head2)
          expect(port).toEqual('443')

          expect(socket.destroy).toHaveBeenCalledOnce()

          resolve()
        }

        const srv = await setup({ onError })

        srv._makeConnection(socket, head, '443', '%7Balgolia_application_id%7D-dsn.algolia.net')
      })
    })

    // https://github.com/cypress-io/cypress/issues/9220
    it('does not crash when a blank URL is parsed and instead only destroys the socket', function () {
      const socket = new EE() as Socket

      socket.destroy = vi.fn()
      const head: Buffer = Buffer.from('')

      return new Promise<void>(async (resolve) => {
        const srv = await setup()

        srv.connect({ url: '%20:443' } as IncomingMessage, socket, head)
        expect(socket.destroy).toHaveBeenCalledOnce()

        resolve()
      })
    })
  })

  describe('#_onServerConnectData', () => {
    // The first byte of a TLS ClientHello record
    const tlsHead = Buffer.from([22, 3, 1])

    afterEach(() => {
      resetServers()
    })

    it('gets the certificate for the hostname of the CONNECT target', async () => {
      const srv = await setup()
      const getPortFor = vi.spyOn(srv, '_getPortFor').mockResolvedValue(54321)
      const makeConnection = vi.spyOn(srv, '_makeConnection').mockReturnValue(undefined)

      srv._onServerConnectData({ url: 'www.Example.com:443' } as IncomingMessage, new EE() as Socket, tlsHead)

      await vi.waitFor(() => expect(makeConnection).toHaveBeenCalled())

      expect(getPortFor).toHaveBeenCalledWith('www.example.com')
      expect(makeConnection).toHaveBeenCalledWith(expect.anything(), tlsHead, '54321', 'localhost')
    })

    it('gets the certificate for the bare address of an IPv6 CONNECT target', async () => {
      const srv = await setup()
      const getPortFor = vi.spyOn(srv, '_getPortFor').mockResolvedValue(54322)
      const makeConnection = vi.spyOn(srv, '_makeConnection').mockReturnValue(undefined)

      srv._onServerConnectData({ url: '[::1]:8443' } as IncomingMessage, new EE() as Socket, tlsHead)

      await vi.waitFor(() => expect(makeConnection).toHaveBeenCalled())

      expect(getPortFor).toHaveBeenCalledWith('::1')
    })
  })

  describe('#_onRequest', () => {
    it('prefixes the request path with the origin from the host header', async () => {
      const onRequest = vi.fn()
      const srv = await setup({ onRequest })
      const req = { url: '/users?page=2', headers: { host: 'www.example.com:8443' } } as unknown as IncomingMessage

      srv._sniServer.emit('request', req, {})

      expect(req.url).toEqual('https://www.example.com:8443/users?page=2')
    })
  })
})
