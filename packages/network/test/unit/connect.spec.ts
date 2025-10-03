import { describe, it, expect, beforeEach, vi } from 'vitest'
import { connect } from '../../lib'

import net from 'net'
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
