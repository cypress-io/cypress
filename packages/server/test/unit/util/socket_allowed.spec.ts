import { beforeEach, describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { EventEmitter } from 'events'
import type { Socket } from 'net'
import { DocumentDomainInjection, RemoteStates } from '@packages/network-tools'

const SERVER_PORT = 4455

const createRemoteStates = (injectDocumentDomain = false) => {
  return new RemoteStates(() => ({ server: SERVER_PORT, fileServer: 4456 }), DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain, testingType: 'e2e' }))
}

describe('lib/util/socket_allowed', function () {
  let sw: SocketAllowed

  beforeEach(() => {
    sw = new SocketAllowed(createRemoteStates(), () => SERVER_PORT)
  })

  describe('#add', () => {
    it('adds localPort to allowed list and removes it when closed', () => {
      const socket = new EventEmitter as Socket

      // @ts-expect-error - localPort is readonly
      socket.localPort = 12345

      const req = {
        socket: {
          remotePort: socket.localPort,
          remoteAddress: '127.0.0.1',
        },
      } as Request

      expect(sw.allowedLocalPorts).toStrictEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)

      sw.add(socket)
      expect(sw.allowedLocalPorts).toStrictEqual([socket.localPort])
      expect(sw.isRequestAllowed(req)).toBe(true)

      socket.emit('close')
      expect(sw.allowedLocalPorts).toStrictEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)
    })
  })

  describe('#isRequestFromLocalhost', () => {
    it('allows loopback remote addresses without any port allow-list entry', () => {
      expect(sw.allowedLocalPorts).toStrictEqual([])

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

  describe('#isTrustedOrigin', () => {
    it('trusts the server\'s own origin before a primary is set', () => {
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(true)
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(false)
    })

    it('trusts only the exact primary origin', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).toBe(true)
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(true)
      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).toBe(false)
      expect(sw.isTrustedOrigin('https://www.foobar.com:3500')).toBe(false)
      expect(sw.isTrustedOrigin('http://www.foobar.com:3501')).toBe(false)
    })

    it('trusts the primary\'s superdomain when injecting document.domain', () => {
      const remoteStates = createRemoteStates(true)

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).toBe(true)
      expect(sw.isTrustedOrigin('http://www.barbaz.com:3500')).toBe(false)
    })

    it('follows the primary as it moves', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://localhost:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(true)

      remoteStates.set('http://www.foobar.com:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(false)
      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).toBe(true)
    })

    it('judges only by the primary while the server has no port', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => undefined)
      remoteStates.set('http://localhost:3500')

      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(true)
      expect(sw.isTrustedOrigin('http://localhost:undefined')).toBe(false)
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(false)
    })

    it('rejects non-http origins', () => {
      for (const origin of ['null', '', 'moz-extension://abc', 'chrome-extension://abc', 'file://', 'about:blank']) {
        expect(sw.isTrustedOrigin(origin), origin).toBe(false)
      }
    })
  })
})
