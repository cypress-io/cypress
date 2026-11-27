import { describe, it, expect, beforeEach, vi } from 'vitest'
import { connect } from '../../lib'

import net from 'net'
import tls from 'tls'
import type { RetryingOptions } from '../../lib/connect'

describe('lib/connect', () => {
  beforeEach(() => {
    vi.spyOn(net, 'connect').mockRestore()
  })

  describe('.byPortAndAddress', () => {
    it('destroy connection immediately onConnect', async () => {
      const socket = new net.Socket()
      const destroy = vi.spyOn(socket, 'destroy')

      // @ts-expect-error - incorrect type definitions on net.Socket
      vi.spyOn(net, 'connect').mockImplementation((port: number, host?: string, connectionListener?: () => void) => {
        process.nextTick(() => {
          connectionListener()
        })

        return socket as any
      })

      const address = await connect.byPortAndAddress(1234, { address: '127.0.0.1' } as net.Address)

      expect(address).toEqual({ address: '127.0.0.1' })
      expect(destroy).toHaveBeenCalled()
    })
  })

  describe('createRetryingSocket', () => {
    const baseOpts: RetryingOptions = {
      family: 0,
      useTls: false,
      port: 3000,
      host: '127.0.0.1',
      getDelayMsForRetry: () => undefined,
    }

    it('advertises http/1.1 over ALPN on tls sockets', () => {
      const tlsSpy = vi.spyOn(tls, 'connect').mockReturnValue(new net.Socket() as any)

      connect.createRetryingSocket({ ...baseOpts, useTls: true }, () => {})

      expect(tlsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ ALPNProtocols: ['http/1.1'] }),
        expect.any(Function),
      )

      tlsSpy.mockRestore()
    })

    it('does not set ALPN on plain tcp sockets', () => {
      const netSpy = vi.spyOn(net, 'connect').mockReturnValue(new net.Socket() as any)

      connect.createRetryingSocket(baseOpts, () => {})

      expect(netSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({ ALPNProtocols: expect.anything() }),
        expect.any(Function),
      )

      netSpy.mockRestore()
    })

    it('cancels retries', () => {
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

      const netSpy = vi.spyOn(net, 'connect')

      return new Promise<void>((resolve) => {
        connect.createRetryingSocket(opts, (err: any, sock, _retry) => {
          expect((err)?.code).toEqual('ECONNREFUSED')
          expect(netSpy).toHaveBeenCalledTimes(3)
          expect(sock).toBeUndefined()
          resolve()
        })
      })
    })
  })
})
