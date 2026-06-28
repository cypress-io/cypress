import { describe, it, expect, beforeEach, vi } from 'vitest'
import { connect } from '../../lib'

import dns from 'dns'
import net from 'net'
import type { RetryingOptions } from '../../lib/connect'

describe('lib/connect', () => {
  beforeEach(() => {
    vi.spyOn(net, 'connect').mockRestore()
    vi.spyOn(dns, 'lookup').mockRestore()
  })

  describe('.isLocalhost', () => {
    it('matches localhost and *.localhost names per RFC 6761', () => {
      ['localhost', 'localhost.', 'myapp.localhost', 'a.b.localhost', 'MyApp.LocalHost'].forEach((hostname) => {
        expect(connect.isLocalhost(hostname), hostname).toBe(true)
      })
    })

    it('does not match other names', () => {
      ['example.com', 'localhost.com', 'notlocalhost', 'localhostx', '127.0.0.1'].forEach((hostname) => {
        expect(connect.isLocalhost(hostname), hostname).toBe(false)
      })
    })
  })

  describe('.lookup', () => {
    const enotfound = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })

    it('falls back to loopback when a localhost name fails to resolve', () => {
      vi.spyOn(dns, 'lookup').mockImplementation(((_hostname, _options, cb) => cb(enotfound)) as any)

      return new Promise<void>((resolve) => {
        connect.lookup('myapp.localhost', {}, (err, address, family) => {
          expect(err).toBeNull()
          expect(address).toBe('127.0.0.1')
          expect(family).toBe(4)
          resolve()
        })
      })
    })

    it('honors the requested ipv6 family when falling back', () => {
      vi.spyOn(dns, 'lookup').mockImplementation(((_hostname, _options, cb) => cb(enotfound)) as any)

      return new Promise<void>((resolve) => {
        connect.lookup('myapp.localhost', { family: 6 }, (err, address, family) => {
          expect(err).toBeNull()
          expect(address).toBe('::1')
          expect(family).toBe(6)
          resolve()
        })
      })
    })

    it('returns all loopback addresses when options.all is set', () => {
      vi.spyOn(dns, 'lookup').mockImplementation(((_hostname, _options, cb) => cb(enotfound)) as any)

      return new Promise<void>((resolve) => {
        connect.lookup('myapp.localhost', { all: true }, (err, addresses) => {
          expect(err).toBeNull()
          expect(addresses).toEqual([
            { address: '127.0.0.1', family: 4 },
            { address: '::1', family: 6 },
          ])

          resolve()
        })
      })
    })

    it('does not fall back for non-localhost names', () => {
      vi.spyOn(dns, 'lookup').mockImplementation(((_hostname, _options, cb) => cb(enotfound)) as any)

      return new Promise<void>((resolve) => {
        connect.lookup('example.com', {}, (err) => {
          expect(err).toBe(enotfound)
          resolve()
        })
      })
    })

    it('passes through a successful resolution unchanged', () => {
      vi.spyOn(dns, 'lookup').mockImplementation(((_hostname, _options, cb) => cb(null, '93.184.216.34', 4)) as any)

      return new Promise<void>((resolve) => {
        connect.lookup('example.com', {}, (err, address, family) => {
          expect(err).toBeNull()
          expect(address).toBe('93.184.216.34')
          expect(family).toBe(4)
          resolve()
        })
      })
    })
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
