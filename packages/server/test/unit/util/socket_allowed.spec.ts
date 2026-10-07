import { beforeEach, describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { EventEmitter } from 'events'
import type { Socket } from 'net'

describe('lib/util/socket_allowed', function () {
  let sw: SocketAllowed

  beforeEach(() => {
    sw = new SocketAllowed()
  })

  describe('#add', () => {
    it('adds localPort to allowed list and removes it when closed', () => {
      const socket = new EventEmitter as Socket

      // @ts-ignore readonly
      socket.localPort = 12345

      const req = {
        socket: {
          remotePort: socket.localPort,
          remoteAddress: '127.0.0.1',
        },
      } as Request

      expect(sw.allowedLocalPorts).toEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)

      sw.add(socket)
      expect(sw.allowedLocalPorts).toEqual([socket.localPort])
      expect(sw.isRequestAllowed(req)).toBe(true)

      socket.emit('close')
      expect(sw.allowedLocalPorts).toEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)
    })
  })

  describe('#isRequestFromLocalhost', () => {
    it('allows loopback remote addresses without any port allow-list entry', () => {
      expect(sw.allowedLocalPorts).toEqual([])

      for (const remoteAddress of ['127.0.0.1', '::1']) {
        const req = { socket: { remoteAddress } } as Request

        expect(sw.isRequestFromLocalhost(req), remoteAddress).toBe(true)
      }
    })

    it('rejects non-loopback remote addresses', () => {
      for (const remoteAddress of ['192.168.1.20', '10.0.0.5', undefined]) {
        const req = { socket: { remoteAddress } } as Request

        expect(sw.isRequestFromLocalhost(req), String(remoteAddress)).toBe(false)
      }
    })
  })
})
